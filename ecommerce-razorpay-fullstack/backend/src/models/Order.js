import mongoose from 'mongoose';
const itemSchema = new mongoose.Schema({ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, name: String, image: String, unitPrice: { type: Number, required: true }, quantity: { type: Number, required: true, min: 1 } }, { _id: false });
const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: { type: [itemSchema], required: true },
  shippingAddress: { name: String, phone: String, line1: String, city: String, state: String, postalCode: String, country: { type: String, default: 'India' } },
  subtotal: { type: Number, required: true }, shipping: { type: Number, default: 0 }, tax: { type: Number, default: 0 }, total: { type: Number, required: true },
  currency: { type: String, default: 'INR' }, paymentMethod: { type: String, enum: ['razorpay', 'cod'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'cod_due', 'refunded'], default: 'pending' },
  orderStatus: { type: String, enum: ['pending_payment', 'placed', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending_payment' },
  razorpayOrderId: String, razorpayPaymentId: String, paidAt: Date
}, { timestamps: true });
export default mongoose.model('Order', orderSchema);
