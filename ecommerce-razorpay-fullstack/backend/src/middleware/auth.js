import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware to protect routes that require user authentication.
export async function protect(req, res, next) {
  try {
    // Read the JWT from the Authorization header.
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ')
      ? header.slice(7)
      : null;

    // Reject requests without an authentication token.
    if (!token) {
      return res.status(401).json({
        message: 'Please sign in to continue.'
      });
    }

    // Verify the token signature and expiration time.
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the account to ensure the user still exists.
    const user = await User.findById(payload.sub)
      .select('_id name email role');

    if (!user) {
      return res.status(401).json({
        message: 'Account no longer exists.'
      });
    }

    // Attach the authenticated user to the request.
    // Later route handlers can use req.user.
    req.user = user;

    next();
  } catch {
    // Reject expired, invalid, or malformed tokens.
    return res.status(401).json({
      message: 'Invalid or expired session. Please sign in again.'
    });
  }
}

// Middleware to restrict access to administrators.
export function adminOnly(req, res, next) {
  // Return 403 when the authenticated user is not an admin.
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      message: 'Administrator access required.'
    });
  }

  next();
}