import { Router } from 'express';
import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { z } from 'zod';

import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { priceItems } from '../utils/pricing.js';

const router = Router();

// Validate the delivery address before creating a payment order.
// These checks help prevent incomplete or excessively long address fields.
const addressSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(8).max(20),
  line1: z.string().trim().min(4).max(200),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().min(4).max(12),
  country: z.string().trim().min(2).max(80).default('India'),
});

// -------------------- RAZORPAY CONFIGURATION --------------------
// Create a Razorpay client using server-side credentials.
// Never expose the Razorpay secret key to the frontend.
function getRazorpay() {
  if (
    !process.env.RAZORPAY_KEY_ID ||
    !process.env.RAZORPAY_KEY_SECRET ||
    process.env.RAZORPAY_KEY_ID.includes('replace')
  ) {
    // Return a service-unavailable error when real test credentials
    // have not been configured in the backend environment.
    throw Object.assign(
      new Error('Razorpay test keys are not configured in backend/.env.'),
      { status: 503 }
    );
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// Provide the frontend with the public key needed to open Razorpay Checkout.
// The secret key must remain on the backend.
router.get('/config', protect, (req, res) => {
  const configured = Boolean(
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET &&
    !process.env.RAZORPAY_KEY_ID.includes('replace')
  );

  res.json({
    keyId: configured ? process.env.RAZORPAY_KEY_ID : null,
    enabled: configured,
  });
});

// -------------------- CREATE PAYMENT ORDER --------------------
// Validate checkout data, calculate the total on the server,
// create a Razorpay order, and save a pending ShopSphere order.
router.post(
  '/create-order',
  protect,
  asyncHandler(async (req, res) => {
    // Validate the cart and delivery address before processing checkout.
    const parsed = z.object({
      items: z.array(
        z.object({
          productId: z.string(),
          quantity: z.coerce.number(),
        })
      ).min(1),
      shippingAddress: addressSchema,
    }).safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Check your cart and shipping address.',
        details: parsed.error.flatten(),
      });
    }

    // Fetch product information and calculate prices on the server.
    // Do not trust totals or unit prices sent by the browser.
    const priced = await priceItems(parsed.data.items);

    // Initialize Razorpay only after validating the checkout data.
    const razorpay = getRazorpay();

    // Razorpay expects the amount in the smallest currency unit.
    // For INR, multiply the rupee total by 100 to obtain paise.
    const rpOrder = await razorpay.orders.create({
      amount: Math.round(priced.total * 100),
      currency: 'INR',
      receipt: `ss_${Date.now()}_${String(req.user._id).slice(-6)}`,
      notes: {
        userId: String(req.user._id),
      },
    });

    // Save the local order using the authenticated customer ID.
    // The order remains pending until payment verification succeeds.
    const order = await Order.create({
      user: req.user._id,
      items: priced.normalized,
      shippingAddress: parsed.data.shippingAddress,
      subtotal: priced.subtotal,
      shipping: priced.shipping,
      tax: priced.tax,
      total: priced.total,
      paymentMethod: 'razorpay',
      paymentStatus: 'pending',
      orderStatus: 'pending_payment',
      razorpayOrderId: rpOrder.id,
    });

    // Return only the checkout information needed by the frontend.
    // The Razorpay secret key is never included in this response.
    res.status(201).json({
      orderId: order._id,
      razorpayOrderId: rpOrder.id,
      amount: rpOrder.amount,
      currency: rpOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      name: 'ShopSphere',
      description: `Order ${String(order._id).slice(-8)}`,
      prefill: {
        name: req.user.name,
        email: req.user.email,
      },
    });
  })
);

// -------------------- VERIFY PAYMENT --------------------
// Verify Razorpay's payment signature on the server before marking
// an order as paid. Never trust a frontend success message alone.
router.post(
  '/verify',
  protect,
  asyncHandler(async (req, res) => {
    // Validate the order and payment identifiers received from Checkout.
    const parsed = z.object({
      orderId: z.string(),
      razorpay_order_id: z.string(),
      razorpay_payment_id: z.string(),
      razorpay_signature: z.string(),
    }).safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Payment verification details are incomplete.',
      });
    }

    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = parsed.data;

    // Find the order using both its ID and the authenticated customer's ID.
    // This prevents users from verifying another customer's order.
    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        message: 'Order not found.',
      });
    }

    // Make repeated verification requests safe when payment was already
    // confirmed. Do not decrement product stock a second time.
    if (order.paymentStatus === 'paid') {
      if (
        order.razorpayOrderId !== razorpay_order_id ||
        order.razorpayPaymentId !== razorpay_payment_id
      ) {
        return res.status(400).json({
          message: 'Payment details do not match the verified order.',
        });
      }

      return res.json({
        message: 'Payment was already verified.',
        order,
      });
    }

    // Ensure the Razorpay order ID matches the order created by our backend.
    if (order.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({
        message: 'Payment order does not match.',
      });
    }

    // Recreate Razorpay's expected signature using the secret key.
    // The signed message format is:
    // razorpay_order_id|razorpay_payment_id
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    // Compare signature buffers using a timing-safe comparison.
    // Check lengths first because timingSafeEqual requires equal lengths.
    const expectedBuffer = Buffer.from(expected, 'hex');
    const receivedBuffer = Buffer.from(razorpay_signature, 'hex');

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      // Record the failed verification without marking the order as paid.
      order.paymentStatus = 'failed';
      await order.save();

      return res.status(400).json({
        message: 'Payment signature verification failed.',
      });
    }

    // Recheck stock after signature verification to avoid accepting an
    // order whose products are no longer available.
    // IMPORTANT: use a MongoDB transaction for atomic stock and order updates
    // in production; this loop alone cannot roll back earlier stock changes.
    for (const item of order.items) {
      const updated = await Product.updateOne(
        {
          _id: item.product,
          active: true,
          stock: { $gte: item.quantity },
        },
        {
          $inc: { stock: -item.quantity },
        }
      );

      // Stop if the product is unavailable or the stock condition failed.
      if (updated.modifiedCount !== 1) {
        return res.status(409).json({
          message: `Stock changed for ${item.name}. Contact support before retrying.`,
        });
      }
    }

    // Save the verified payment details and move the order into the
    // normal placed state. The payment ID is retained for reconciliation.
    order.razorpayPaymentId = razorpay_payment_id;
    order.paymentStatus = 'paid';
    order.orderStatus = 'placed';
    order.paidAt = new Date();

    await order.save();

    res.json({
      message: 'Payment verified successfully.',
      order,
    });
  })
);

export default router;