import { Router } from 'express';
import Order from '../models/Order.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

/**
 * Protect all admin routes.
 * Users must be authenticated and have administrator privileges
 * before accessing any endpoint defined in this router.
 */
router.use(protect, adminOnly);

/**
 * GET /api/admin/orders
 * Retrieves recent orders for the administrator dashboard.
 * Includes each order's customer name and email.
 * Results are sorted newest first and limited to 200 orders.
 */
router.get(
  '/orders',
  asyncHandler(async (req, res) => {
    // Fetch orders and populate basic customer information.
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(200);

    // Return the orders for display in the admin dashboard.
    res.json({ orders });
  })
);

/**
 * PATCH /api/admin/orders/:id/status
 * Updates the status of an existing order.
 * Only the allowed statuses can be assigned through this endpoint.
 */
router.patch(
  '/orders/:id/status',
  asyncHandler(async (req, res) => {
    // Define the order statuses that administrators can assign.
    const allowed = [
      'processing',
      'shipped',
      'delivered',
      'cancelled'
    ];

    // Reject missing or unsupported status values.
    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({
        message: `Status must be one of: ${allowed.join(', ')}.`
      });
    }

    // Find the requested order in the database.
    const order = await Order.findById(req.params.id);

    // Return 404 if the order does not exist.
    if (!order) {
      return res.status(404).json({
        message: 'Order not found.'
      });
    }

    // Prevent an unpaid online order from being fulfilled.
    // Cancellation is still permitted by this existing rule.
    if (
      order.paymentStatus === 'pending' &&
      req.body.status !== 'cancelled'
    ) {
      return res.status(400).json({
        message: 'Cannot fulfill an unpaid online order.'
      });
    }

    // Update and save the order status in MongoDB.
    order.orderStatus = req.body.status;
    await order.save();

    // Return the updated order to the frontend.
    res.json({ order });
  })
);

// Export the router for registration in the Express application.
export default router;
