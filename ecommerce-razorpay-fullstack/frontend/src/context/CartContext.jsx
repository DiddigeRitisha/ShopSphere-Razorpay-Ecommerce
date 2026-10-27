import { createContext, useContext, useEffect, useMemo, useState } from 'react';
const CartContext = createContext(null);
export function CartProvider({ children }) {
 const [items, setItems] = useState(() => { try { return JSON.parse(localStorage.getItem('shopsphere_cart') || '[]'); } catch { return []; } });
 useEffect(() => localStorage.setItem('shopsphere_cart', JSON.stringify(items)), [items]);
 function add(product) { setItems((old) => { const found = old.find((x) => x._id === product._id); return found ? old.map((x) => x._id === product._id ? { ...x, quantity: Math.min(20, x.quantity + 1) } : x) : [...old, { ...product, quantity: 1 }]; }); }
 function update(id, quantity) { if (quantity < 1) return remove(id); setItems((old) => old.map((x) => x._id === id ? { ...x, quantity: Math.min(20, quantity) } : x)); }
 function remove(id) { setItems((old) => old.filter((x) => x._id !== id)); }
 function clear() { setItems([]); }
 const count = items.reduce((n, x) => n + x.quantity, 0); const subtotal = items.reduce((n, x) => n + x.price * x.quantity, 0);
 const value = useMemo(() => ({ items, add, update, remove, clear, count, subtotal }), [items, count, subtotal]);
 return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export const useCart = () => useContext(CartContext);
