import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, UserRound, Menu, X, LogOut, Package, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext'; import { useCart } from '../context/CartContext';
export function Layout({ children }) {
 const { user, logout } = useAuth(); const { count } = useCart(); const [open, setOpen] = useState(false); const [query, setQuery] = useState(''); const navigate = useNavigate();
 function search(e) { e.preventDefault(); navigate(`/?q=${encodeURIComponent(query)}`); setOpen(false); }
 return <><div className="announcement">Thoughtful finds for everyday living <span>•</span> Free shipping over ₹999</div><header className="header"><div className="container nav-wrap"><Link to="/" className="brand"><span className="brand-mark">S</span><span>shop<span className="brand-accent">sphere</span><small>EVERYDAY, ELEVATED</small></span></Link><button className="mobile-toggle icon-button" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X/> : <Menu/>}</button><nav className={open ? 'nav-links open' : 'nav-links'}><NavLink to="/" onClick={() => setOpen(false)}>Home</NavLink><NavLink to="/?category=Electronics" onClick={() => setOpen(false)}>Electronics</NavLink><NavLink to="/?category=Fashion" onClick={() => setOpen(false)}>Fashion</NavLink><Link to="/#why-shop" onClick={() => setOpen(false)}>Our story</Link></nav><div className="nav-actions"><form className="search-form" onSubmit={search}><Search size={17}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" aria-label="Search products"/></form>{user ? <div className="account-menu"><Link className="icon-button" to="/orders" title="My orders"><Package size={20}/></Link>{user.role === 'admin' && <Link className="icon-button" to="/admin" title="Admin dashboard"><ShieldCheck size={20}/></Link>}<button className="icon-button" onClick={() => { logout(); navigate('/'); }} title="Sign out"><LogOut size={20}/></button></div> : <Link className="icon-button" to="/login" title="Sign in"><UserRound size={20}/></Link>}<Link className="cart-button" to="/cart" aria-label={`Cart with ${count} items`}><ShoppingBag size={20}/><span>{count}</span></Link></div></div></header><main>{children}</main><footer className="footer" id="why-shop"><div className="container footer-grid"><div><Link to="/" className="brand footer-brand"><span className="brand-mark">S</span><span>shop<span className="brand-accent">sphere</span><small>EVERYDAY, ELEVATED</small></span></Link><p>Useful things, beautifully chosen. Make the everyday feel a little more special.</p></div><div><h4>Explore</h4><Link to="/">Shop all</Link><Link to="/?category=Home">Home essentials</Link><Link to="/?category=Accessories">Accessories</Link><Link to="/?category=Beauty">Beauty & care</Link><Link to="/?category=Footwear">Footwear</Link></div><div><h4>Customer care</h4><Link to="/orders">Track an order</Link><a href="mailto:hello@shopsphere.example">Contact support</a><span>Returns within 7 days</span></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} ShopSphere. Student project demo.</span><span>Secure checkout · Razorpay test mode</span></div></footer></>;
}
const PRODUCT_IMAGE_OVERRIDES = {
  "6ad238be9346faf61e565263":
    "https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?auto=format&fit=crop&w=900&q=85",

  "6adc46339346faf61e565264":
    "https://media.istockphoto.com/id/1943136753/photo/pillow-hanging-in-shop-closeup.jpg?s=612x612&w=is&k=20&c=fmnh1ZHUfyLEvrJ5AqZY4vUtLpyZXp4dNYeJImdF3r4=",
};
export function ProductCard({ product, onAdd }) {
  const fallbackImage = "https://placehold.co/600x600?text=ShopSphere";

  return (
    <article className="product-card">
      <Link
        to={`/product/${product._id}`}
        className="product-image-wrap"
      >
        <img
  src={PRODUCT_IMAGE_OVERRIDES[product._id] || product.image || fallbackImage}
  alt={product.name}
  loading="lazy"
  onError={(event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = fallbackImage;
  }}
/>

        <span className="image-badge">
          {product.featured ? "CURATED" : product.category.toUpperCase()}
        </span>
      </Link>

      <div className="product-info">
        <div className="product-category">{product.category}</div>

        <Link
          to={`/product/${product._id}`}
          className="product-name"
        >
          {product.name}
        </Link>

        <div className="rating">
          <span>★★★★★</span>
          <small>{Number(product.rating || 4.5).toFixed(1)}</small>
        </div>

        <div className="product-buy">
          <strong>
            ₹{Number(product.price || 0).toLocaleString("en-IN")}
          </strong>

          <button
            onClick={() => onAdd(product)}
            className="add-button"
            disabled={product.stock < 1}
          >
            {product.stock < 1 ? "Sold out" : "Add +"}
          </button>
        </div>
      </div>
    </article>
  );
}