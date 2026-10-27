
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ShieldCheck,
  Truck,
  Image as ImageIcon,
} from "lucide-react";
import { api } from "../api";
import { useCart } from "../context/CartContext";

const FALLBACK_IMAGE =
  "https://placehold.co/900x900/f2f0ec/26334a?text=ShopSphere";
const PRODUCT_IMAGE_OVERRIDES = {
  "6ad238be9346faf61e565263":
    "https://images.unsplash.com/photo-1600369671236-e74521d4b6ad?auto=format&fit=crop&w=900&q=85",

  "6adc46339346faf61e565264":
    "https://media.istockphoto.com/id/1943136753/photo/pillow-hanging-in-shop-closeup.jpg?s=612x612&w=is&k=20&c=fmnh1ZHUfyLEvrJ5AqZY4vUtLpyZXp4dNYeJImdF3r4=",
};

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);
  const { add } = useCart();

  useEffect(() => {
    let active = true;

    setProduct(null);
    setError("");
    setImageError(false);

    api(`/products/${id}`)
      .then((data) => {
        if (active) setProduct(data.product);
      })
      .catch((err) => {
        if (active) setError(err.message || "Unable to load product.");
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (error) {
    return (
      <div className="container page-wrap">
        <div className="alert error">{error}</div>
        <Link to="/" className="text-link">
          <ArrowLeft size={16} /> Back to shop
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container page-wrap loading-line">
        Loading product…
      </div>
    );
  }

  const price = Number(product.price || 0);
  const rating = Number(product.rating || 4.5);
  const category = product.category || "Essentials";
  const stock = Number(product.stock || 0);

  return (
    <div className="container page-wrap product-detail-page">
      <Link to="/" className="text-link back-link">
        <ArrowLeft size={16} />
        Back to shop
      </Link>

      <div className="detail-layout">
        <div className="detail-image">
        <div className="detail-image">
  <img
    key={id}
    src={
  PRODUCT_IMAGE_OVERRIDES[product._id] || product.image
}
    alt={product.name || "ShopSphere product"}
    onLoad={() => console.log("Product image loaded:", PRODUCT_IMAGE_OVERRIDES[id])}
    onError={(e) => {
      console.error("Image failed to load:", e.currentTarget.src);
      e.currentTarget.onerror = null;
      e.currentTarget.src = FALLBACK_IMAGE;
    }}
  />
</div>
          <img
  src={
    imageError
      ? FALLBACK_IMAGE
      : PRODUCT_IMAGE_OVERRIDES[id] || product.image || FALLBACK_IMAGE
  }
  alt={product.name || "ShopSphere product"}
  onError={() => setImageError(true)}
/>

          <span className="image-badge">
            {product.featured ? "CURATED PICK" : category.toUpperCase()}
          </span>

          {imageError && (
            <span className="image-fallback-label">
              <ImageIcon size={14} />
              Image unavailable
            </span>
          )}
        </div>

        <div className="detail-copy">
          <span className="eyebrow">
            {category.toUpperCase()} / SHOPSPHERE EDIT
          </span>

          <h1>
            {product.name}
            <em>.</em>
          </h1>

          <div className="rating detail-rating">
            <span>★★★★★</span>
            <small>{rating.toFixed(1)} / 5</small>
          </div>

          <div className="detail-price">
            ₹{price.toLocaleString("en-IN")}
          </div>

          <p>
            {product.description ||
              "A thoughtful everyday essential, selected for quality, comfort, and useful design."}
          </p>

          <div className="stock-line">
            <Check size={16} />
            {stock > 0 ? `${stock} in stock` : "Currently out of stock"}
          </div>

          <button
            className="button button-primary button-full detail-add"
            disabled={stock < 1}
            onClick={() => add(product)}
          >
            {stock < 1 ? "Sold out" : "Add to bag"}
            <ArrowRight size={17} />
          </button>

          <div className="detail-perks">
            <div>
              <Truck />
              <span>
                <strong>Reliable delivery</strong>
                <small>Free over ₹999</small>
              </span>
            </div>

            <div>
              <ShieldCheck />
              <span>
                <strong>Secure payment</strong>
                <small>Razorpay test checkout</small>
              </span>
            </div>
          </div>

          <div className="detail-footnote">
            Product imagery is illustrative. Availability and pricing are
            managed by the project database.
          </div>
        </div>
      </div>
    </div>
  );
}
