import { Router } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { z } from 'zod';

import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Validate registration data before interacting with the database.
// Trimming the name removes accidental spaces around the submitted value.
const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email().max(160),
  password: z.string().min(8).max(100),
});

// Validate login credentials before searching for the user.
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Validate the email address submitted for account recovery.
const forgotSchema = z.object({
  email: z.string().email().max(160),
});

// Validate the reset token and the user's new password.
const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(100),
});

// Return only public user information.
// Never include password hashes or password-reset tokens in API responses.
function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

// Generate a signed JWT for the authenticated user.
// The token contains the user ID and role and expires after the configured period.
function tokenFor(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// Create the email transporter using server-side SMTP credentials.
// Throw an error when required configuration is missing so the caller
// can handle email delivery failures without exposing credentials.
function getMailer() {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    throw new Error('Email service is not configured.');
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// -------------------- USER REGISTRATION --------------------
// Create a new customer account after validating the submitted information.
router.post('/register', asyncHandler(async (req, res) => {
  // safeParse returns validation errors instead of throwing an exception.
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Please provide a valid name, email and password (at least 8 characters).',
    });
  }

  const { name, email, password } = parsed.data;

  // Normalize email addresses so differently capitalized versions
  // are treated consistently during account lookup.
  const normalizedEmail = email.toLowerCase();

  // Prevent duplicate accounts using the same email address.
  const existing = await User.findOne({ email: normalizedEmail });

  if (existing) {
    return res.status(409).json({
      message: 'An account with this email already exists.',
    });
  }

  // Create the user. The User model should hash the password
  // automatically through its password-hashing save middleware.
  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
  });

  // Return a JWT and safe user details after successful registration.
  res.status(201).json({
    token: tokenFor(user),
    user: publicUser(user),
  });
}));

// -------------------- USER LOGIN --------------------
// Authenticate an existing user using their email and password.
router.post('/login', asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Enter a valid email and password.',
    });
  }

  // Explicitly select the password hash because the User model
  // may exclude it from normal database queries by default.
  const user = await User.findOne({
    email: parsed.data.email.toLowerCase(),
  }).select('+password');

  // Use the model's password comparison method.
  // Return the same error for an unknown email and an incorrect password.
  if (!user || !(await user.comparePassword(parsed.data.password))) {
    return res.status(401).json({
      message: 'Email or password is incorrect.',
    });
  }

  // Sign a JWT for subsequent authenticated API requests.
  res.json({
    token: tokenFor(user),
    user: publicUser(user),
  });
}));

// -------------------- FORGOT PASSWORD --------------------
// Generate a time-limited password-reset link and email it to the user.
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const parsed = forgotSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Please enter a valid email address.',
    });
  }

  // Use the same success message whether or not the account exists.
  // This helps prevent attackers from discovering registered email addresses.
  const genericMessage =
    'If an account exists for this email, reset instructions will be sent.';

  const user = await User.findOne({
    email: parsed.data.email.toLowerCase(),
  });

  if (!user) {
    return res.json({ message: genericMessage });
  }

  // Generate a cryptographically secure, unpredictable reset token.
  // The raw token is sent by email; only its SHA-256 hash is stored in MongoDB.
  const rawToken = crypto.randomBytes(32).toString('hex');

  user.passwordResetToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  // Expire the reset token after 15 minutes.
  user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);

  // Persist the hashed token and expiry before sending the email.
  await user.save();

  // This URL must match the actual frontend address and reset-password route.
  const frontendUrl =
    process.env.CLIENT_URL || 'http://localhost:5173';

  const resetUrl =
    `${frontendUrl}/reset-password?token=${rawToken}`;

  try {
    const mailer = getMailer();

    // Send both plain-text and HTML versions for email-client compatibility.
    await mailer.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: 'Reset your ShopSphere password',
      text: [
        `Hello ${user.name},`,
        '',
        'We received a request to reset your ShopSphere password.',
        '',
        `Open this link within 15 minutes: ${resetUrl}`,
        '',
        'If you did not request this, you can ignore this email.',
      ].join('\n'),
      html: `
        <p>Hello ${user.name},</p>
        <p>We received a request to reset your ShopSphere password.</p>
        <p>
          <a href="${resetUrl}">Reset my password</a>
        </p>
        <p>This link expires in 15 minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      `,
    });
  } catch (error) {
    // Invalidate the reset token if delivery fails, preventing the user
    // from relying on a reset link that was never successfully delivered.
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Log the server-side error for troubleshooting without returning
    // SMTP credentials or other sensitive configuration to the browser.
    console.error('Password reset email failed:', error.message);

    return res.status(503).json({
      message: 'Email delivery is unavailable. Please try again later.',
    });
  }

  // Do not reveal whether the requested email belongs to a registered user.
  res.json({ message: genericMessage });
}));

// -------------------- RESET PASSWORD --------------------
// Accept a valid reset token and replace the account password.
router.post('/reset-password', asyncHandler(async (req, res) => {
  const parsed = resetSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Provide a valid reset token and a password of at least 8 characters.',
    });
  }

  // Hash the supplied token in the same way it was hashed when generated.
  // The original token is never stored in the database.
  const hashedToken = crypto
    .createHash('sha256')
    .update(parsed.data.token)
    .digest('hex');

  // Accept only a matching token whose expiration time is still in the future.
  // Explicitly select fields that may be excluded from normal queries.
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires +password');

  if (!user) {
    return res.status(400).json({
      message: 'This reset link is invalid or has expired. Please request another.',
    });
  }

  // Assign the new password. The User model must hash it before saving.
  user.password = parsed.data.password;

  // Clear the reset token immediately so it cannot be reused.
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  res.json({
    message: 'Password reset successful. You can now sign in.',
  });
}));

// -------------------- CURRENT USER --------------------
// Return the authenticated user's public profile.
// The protect middleware verifies the JWT and attaches the user to req.user.
router.get('/me', protect, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;