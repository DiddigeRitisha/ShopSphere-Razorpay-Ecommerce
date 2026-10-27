import { useEffect, useState } from 'react'; import { Link, useParams } from 'react-router-dom'; import { CheckCircle2, Download, ArrowRight, PackageCheck } from 'lucide-react'; import { api } from '../api';
export default function OrderSuccess(){const {id}=useParams();const [order,setOrder]=useState(null);const [error,setError]=useState('');useEffect(()=>{api(`/orders/${id}`).then(d=>setOrder(d.order)).catch(e=>setError(e.message))},[id]);function invoice(){if(!order)return;const rows=order.items.map(i=>`${i.name} | ${i.quantity} | INR ${i.unitPrice.toFixed(2)} | INR ${(i.quantity*i.unitPrice).toFixed(2)}`).join(String.fromCharCode(10));const text=`SHOPSPHERE — ORDER INVOICE
Order: ${order._id}
Date: ${new Date(order.createdAt).toLocaleString()}
Customer: ${order.shippingAddress.name}
Address: ${order.shippingAddress.line1}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}

ITEMS
Product | Qty | Unit price | Amount
${rows}

Subtotal: INR ${order.subtotal.toFixed(2)}
Shipping: INR ${order.shipping.toFixed(2)}
Tax: INR ${order.tax.toFixed(2)}
TOTAL: INR ${order.total.toFixed(2)}
Payment method: ${order.paymentMethod}
Payment status: ${order.paymentStatus}
Order status: ${order.orderStatus}

Student project invoice — not a tax invoice.`;const blob=new Blob([text],{type:'text/plain'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`shopsphere-invoice-${order._id.slice(-8)}.txt`;a.click();URL.revokeObjectURL(url)}
return <div className="container page-wrap">{error?<div className="alert error">{error}</div>:!order?<div className="loading-line">Loading your order…</div>:<div className="success-card"><div className="success-icon"><CheckCircle2 size={42}/></div><span className="eyebrow">THANK YOU FOR SHOPPING WITH US</span><h1>{order.paymentStatus==='paid'||order.paymentMethod==='cod'?'Your order is in.':'Order created.'}</h1><p>{order.paymentStatus==='paid'?'Your payment is verified and your order is being prepared.':order.paymentMethod==='cod'?'Your order has been placed. Payment is due on delivery.':'Your payment is not confirmed yet. Check My Orders before trying again.'}</p><div className="success-order-id">ORDER REFERENCE <strong>#{order._id.slice(-8).toUpperCase()}</strong><span className={`status status-${order.orderStatus}`}>{order.orderStatus.replaceAll('_',' ')}</span></div><div className="success-items">{order.items.map(i=><div className="mini-item" key={String(i.product)}><img src={i.image} alt=""/><div><strong>{i.name}</strong><small>Quantity: {i.quantity}</small></div><span>₹{(i.unitPrice*i.quantity).toLocaleString('en-IN')}</span></div>)}</div><div className="summary-total"><span>Total paid / due</span><strong>₹{order.total.toLocaleString('en-IN',{minimumFractionDigits:2})}</strong></div><div className="success-actions"><button onClick={invoice} className="button button-outline"><Download size={16}/> Download invoice</button><Link to="/orders" className="button button-primary">View my orders <ArrowRight size={16}/></Link></div><div className="success-foot"><PackageCheck size={18}/> An order summary is available in your account.</div></div>}</div>}
