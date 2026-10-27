import { Router } from 'express';
import { z } from 'zod';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { priceItems } from '../utils/pricing.js';

const router = Router();

// Validate the shipping address before saving an order.
// Trimming removes surrounding whitespace, and the length limits
// help reject incomplete or excessively long address fields.
const addressSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(8).max(20),
  line1: z.string().trim().min(4).max(200),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().min(4).max(12),
  country: z.string().trim().min(2).max(80).default('India'),
});

// -------------------- CREATE COD ORDER --------------------
// Create a cash-on-delivery order for the authenticated customer.
// The protect middleware ensures that an unauthenticated request is rejected.
router.post(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    // Validate cart items and shipping details before processing the order.
    const parsed = z
      .object({
        items: z.array(
          z.object({
            productId: z.string(),
            // Coerce numeric strings into numbers when possible.
            quantity: z.coerce.number(),
          })
        ).min(1),
        shippingAddress: addressSchema,
      })
      .safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Check your cart and shipping address.',
        details: parsed.error.flatten(),
      });
    }

    // Calculate prices on the server using current database product data.
    // Never trust product prices or totals supplied by the frontend.
    const priced = await priceItems(parsed.data.items);

    // Save the order against the authenticated user.
    // COD orders are marked as awaiting cash collection, not paid.
    const order = await Order.create({
      user: req.user._id,
      items: priced.normalized,
      shippingAddress: parsed.data.shippingAddress,
      subtotal: priced.subtotal,
      shipping: priced.shipping,
      tax: priced.tax,
      total: priced.total,
      paymentMethod: 'cod',
      paymentStatus: 'cod_due',
      orderStatus: 'placed',
    });

    // Reserve stock for each ordered product by decrementing its quantity.
    // The stock condition prevents an individual update from making stock
    // negative. For stronger consistency, use a MongoDB transaction or
    // check every update result and roll back the order if one fails.
    await Promise.all(
      priced.normalized.map((item) =>
        Product.updateOne(
          {
            _id: item.product,
            stock: { $gte: item.quantity },
          },
          {
            $inc: { stock: -item.quantity },
          }
        )
      )
    );

    // Return the saved order so the frontend can display confirmation.
    res.status(201).json({
      order,
      message: 'Order placed. Pay cash on delivery.',
    });
  })
);

// -------------------- CUSTOMER ORDER HISTORY --------------------
// Return only orders owned by the currently authenticated customer.
// Sorting by creation date displays the newest orders first.
router.get(
  '/my',
  protect,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.json({ orders });
  })
);

// -------------------- CANCEL AN ORDER --------------------
// Cancel an eligible unpaid order belonging to the authenticated customer.
// Paid orders require a separate cancellation/refund workflow.
router.patch(
  '/:id/cancel',
  protect,
  asyncHandler(async (req, res) => {
    // Match the order ID and customer ID together.
    // This prevents a customer from cancelling another customer's order.
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        message: 'Order not found.',
      });
    }

    // Orders that are already cancelled, shipped, or delivered
    // cannot be cancelled through this endpoint.
    if (
      ['cancelled', 'delivered', 'shipped'].includes(
        order.orderStatus
      )
    ) {
      return res.status(400).json({
        message:
          order.orderStatus === 'shipped'
            ? 'This order has already shipped. Please contact support.'
            : `This order cannot be cancelled because it is ${order.orderStatus}.`,
      });
    }

    // Never mark a paid order as cancelled without handling the payment
    // and any applicable refund through a verified refund workflow.
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        message:
          'This order has been paid. Please contact support to arrange cancellation and any applicable refund.',
      });
    }

    // Remember the current status so the database update can check that
    // another request has not changed the order in the meantime.
    const previousStatus = order.orderStatus;

    // Atomically change the status only if the order is still eligible.
    // This reduces the risk of two simultaneous cancellation requests
    // both succeeding.
    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        user: req.user._id,
        orderStatus: previousStatus,
        paymentStatus: { $ne: 'paid' },
      },
      {
        $set: {
          orderStatus: 'cancelled',
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedOrder) {
      return res.status(409).json({
        message:
          'The order changed while you were cancelling it. Refresh your order history and try again.',
      });
    }

    // Return reserved quantities to stock after cancellation succeeds.
    // In a production system, update the order and stock in a MongoDB
    // transaction so both operations succeed or fail together.
    await Promise.all(
      updatedOrder.items.map((item) =>
        Product.updateOne(
          { _id: item.product },
          { $inc: { stock: item.quantity } }
        )
      )
    );

    // Keep cancelled orders in the database so they remain visible
    // in the customer's order history.
    res.json({
      message: 'Order cancelled successfully.',
      order: updatedOrder,
    });
  })
);

// -------------------- GET A SINGLE ORDER --------------------
// Allow the order owner or an administrator to view an order.
router.get(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: 'Order not found.',
      });
    }

    // Compare IDs explicitly to avoid type mismatches between ObjectIds
    // and strings. Administrators may inspect orders belonging to others.
    if (
      String(order.user) !== String(req.user._id) &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        message: 'You cannot view this order.',
      });
    }

    res.json({ order });
  })
);

export default router;