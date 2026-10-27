import Product from '../models/Product.js';
export async function priceItems(items) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) throw Object.assign(new Error('Cart must contain between 1 and 50 line items.'), { status: 400 });
  const ids = [...new Set(items.map((i) => String(i.productId || '')))];
  const products = await Product.find({ _id: { $in: ids }, active: true });
  const map = new Map(products.map((p) => [String(p._id), p]));
  const normalized = items.map((item) => {
    const product = map.get(String(item.productId));
    const quantity = Number(item.quantity);
    if (!product) throw Object.assign(new Error('A product in your cart is unavailable.'), { status: 400 });
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) throw Object.assign(new Error('Each quantity must be between 1 and 20.'), { status: 400 });
    if (product.stock < quantity) throw Object.assign(new Error(`${product.name} does not have enough stock.`), { status: 400 });
    return { product: product._id, name: product.name, image: product.image, unitPrice: product.price, quantity };
  });
  const subtotal = Number(normalized.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(2));
  const shipping = subtotal >= 999 ? 0 : 79;
  const tax = Number((subtotal * 0.05).toFixed(2));
  const total = Number((subtotal + shipping + tax).toFixed(2));
  return { normalized, subtotal, shipping, tax, total };
}
