import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  RefreshCw,
  Headphones,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../api';
import { useCart } from '../context/CartContext';
import { ProductCard } from '../components/Layout';

const categoryArt = [
  {
    name: 'Electronics',
    text: 'Smarter everyday tech',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=900&q=80'
  },
  {
    name: 'Fashion',
    text: 'Comfort meets character',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80'
  },
  {
    name: 'Home',
    title: 'Home & Living',
    text: 'Little things, lovely spaces',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=80'
  },
  {
    name: 'Accessories',
    text: 'Finishing touches',
    image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=900&q=80'
  },
  {
    name: 'Beauty',
    text: 'Your daily self-care ritual',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80'
  },
  {
    name: 'Footwear',
    text: 'Step out in comfort',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80'
  }
];

// Keep only one product for each name and category.
function removeDuplicateProducts(products = []) {
  const unique = new Map();

  for (const product of products) {
    const name = (product.name || '').trim().toLowerCase();
    const category = (product.category || '').trim().toLowerCase();
    const key = `${name}::${category}`;

    if (!name) continue;

    if (!unique.has(key)) {
      unique.set(key, product);
    }
  }

  return Array.from(unique.values());
}
const HOME_PRODUCT_IMAGES = {
  "printed cotton cushion cover set":
    "https://media.istockphoto.com/id/1943136753/photo/pillow-hanging-in-shop-closeup.jpg?s=612x612&w=is&k=20&c=fmnh1ZHUfyLEvrJ5AqZY4vUtLpyZXp4dNYeJImdF3r4=",

  "premium microfiber towel set":
    "https://images.unsplash.com/photo-1600369671236-e74521d4b6ad?auto=format&fit=crop&w=900&q=85",
};
export default function Home() {
  const [params] = useSearchParams();
  const { add } = useCart();

  const [data, setData] = useState({
    products: [],
    categories: ['All'],
    total: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMessage, setNewsletterMessage] = useState('');

  const category = params.get('category') || 'All';
  const q = params.get('q') || '';

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    api(
      `/products?limit=100&category=${encodeURIComponent(category)}&q=${encodeURIComponent(q)}`
    )
      .then((response) => {
        if (!active) return;

        const products = removeDuplicateProducts(response.products || []);

        setData({
          ...response,
          products,
          total: products.length
        });
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [category, q, attempt]);

  useEffect(() => {
    if (params.has('category')) {
      requestAnimationFrame(() => {
        document.getElementById('shop')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      });
    }
  }, [category, params]);

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">
              <Sparkles size={15} /> BETTER FINDS, BETTER DAYS
            </span>

            <h1>
              Everyday essentials.
              <br />
              <em>Extraordinary</em> living.
            </h1>

            <p>
              Discover thoughtful products that make life simpler, more
              comfortable, and a little more beautiful.
            </p>

            <div className="hero-actions">
              <a href="#shop" className="button button-primary">
                Explore collection <ArrowRight size={18} />
              </a>
              <a href="#categories" className="text-link">
                Browse categories <ArrowUpRight size={16} />
              </a>
            </div>

            <div className="hero-trust">
              <div className="avatar-stack">
                <span>✦</span>
                <span>✿</span>
                <span>●</span>
              </div>
              <div>
                <strong>Loved by everyday explorers</strong>
                <small>Carefully chosen. Fairly priced.</small>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-blob"></div>
            <img
              className="hero-main-image"
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=90"
              alt="Curated lifestyle essentials"
            />
            <div className="floating-note note-top">
              <span className="note-icon">✳</span>
              <div>
                <strong>Thoughtfully selected</strong>
                <small>Quality in every detail</small>
              </div>
            </div>
            <div className="floating-note note-bottom">
              <span className="note-stars">★★★★★</span>
              <strong>Made for your everyday</strong>
            </div>
            <div className="hero-index">
              01 <span>—</span> 04
            </div>
          </div>
        </div>
      </section>

      <section className="benefits">
        <div className="container benefits-grid">
          <div>
            <Truck />
            <span>
              <strong>Reliable delivery</strong>
              <small>Tracked to your door</small>
            </span>
          </div>
          <div>
            <ShieldCheck />
            <span>
              <strong>Secure checkout</strong>
              <small>Protected payments</small>
            </span>
          </div>
          <div>
            <RefreshCw />
            <span>
              <strong>Easy returns</strong>
              <small>7-day return window</small>
            </span>
          </div>
          <div>
            <Headphones />
            <span>
              <strong>Here to help</strong>
              <small>Friendly support</small>
            </span>
          </div>
        </div>
      </section>

      <section className="section container" id="categories">
        <div className="section-heading">
          <div>
            <span className="eyebrow">FIND YOUR FAVOURITES</span>
            <h2>
              Shop by <em>mood.</em>
            </h2>
          </div>
          <p>Little upgrades for every corner of your life.</p>
        </div>

        <div className="category-grid">
          {categoryArt.map((item, index) => (
            <Link
              to={`/?category=${encodeURIComponent(item.name)}#shop`}
              className={`category-tile category-${index}`}
              key={item.name}
            >
              <img src={item.image} alt={item.title || item.name} />
              <div className="category-overlay">
                <span>{item.text}</span>
                <h3>{item.title || item.name}</h3>
                <span className="round-arrow">
                  <ArrowUpRight size={18} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section products-section" id="shop">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">THE GOOD STUFF</span>
              <h2>
                {q
                  ? `Results for "${q}"`
                  : category === 'All'
                    ? 'Customer favourites'
                    : `${category} picks`}
                <em>.</em>
              </h2>
            </div>
            <span className="results-count">
              {data.products.length} thoughtfully chosen items
            </span>
          </div>

          {error && (
            <div className="alert error product-error">
              <div>
                <strong>We couldn’t load the collection.</strong>
                <span>
                  {error}. Make sure the backend and MongoDB are running.
                </span>
              </div>
              <button
                type="button"
                className="button button-outline"
                onClick={() => setAttempt((value) => value + 1)}
              >
                Try again <RefreshCw size={15} />
              </button>
            </div>
          )}

          {loading ? (
            <div className="loading-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((number) => (
                <div className="skeleton" key={number} />
              ))}
            </div>
          ) : data.products.length > 0 ? (
            <div className="product-grid">
  {data.products
    .filter((product, index, products) => {
      const name = product.name?.trim().toLowerCase();
      const image = product.image?.trim();

      return (
        name &&
        products.findIndex(
          (item) => item.name?.trim().toLowerCase() === name
        ) === index &&
        (!image ||
          products.findIndex((item) => item.image?.trim() === image) === index)
      );
    })
    .slice(0, 10)
    .map((product) => {
  const productName = product.name?.trim().toLowerCase();
  const customImage = HOME_PRODUCT_IMAGES[productName];

  return (
    <ProductCard
      key={product._id}
      product={
        customImage
          ? { ...product, image: customImage }
          : product
      }
      onAdd={add}
    />
  );
})}
</div>
          ) : (
            <div className="empty-state">
              <h3>No products found yet</h3>
              <p>
                Run the seed command to load demo products, or try a different
                search.
              </p>
              <Link
                className="button button-primary"
                to="/?category=All"
              >
                View all products <ArrowRight size={17} />
              </Link>
            </div>
          )}

          <div className="center-action">
            <Link
              to="/?category=All"
              className="button button-outline"
            >
              View all products <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      <section className="editorial">
        <div className="container editorial-grid">
          <div className="editorial-image">
            <img
              src="https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1200&q=85"
              alt="Calm, considered home essentials"
            />
            <span className="editorial-stamp">
              MADE FOR
              <br />
              REAL LIFE
            </span>
          </div>

          <div className="editorial-copy">
            <span className="eyebrow">OUR LITTLE PHILOSOPHY</span>
            <h2>
              Less noise.
              <br />
              <em>More meaning.</em>
            </h2>
            <p>
              We believe shopping should feel simple. That's why we focus on
              useful design, honest value, and products you'll reach for again
              and again.
            </p>
            <Link to="/?category=Home" className="text-link">
              Discover the collection <ArrowRight size={17} />
            </Link>
            <div className="editorial-signoff">
              Thoughtfully picked <span>✳</span> Just for you
            </div>
          </div>
        </div>
      </section>

      <section className="newsletter container">
        <div>
          <span className="eyebrow">A LITTLE GOOD IN YOUR INBOX</span>
          <h2>
            Stay in the <em>loop.</em>
          </h2>
          <p>New arrivals, useful ideas, and the occasional treat.</p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            setNewsletterMessage(
              'Thanks for joining! Newsletter sign-up is saved as a demo interaction.'
            );
            setNewsletterEmail('');
          }}
        >
          <input
            type="email"
            value={newsletterEmail}
            onChange={(event) => {
              setNewsletterEmail(event.target.value);
              setNewsletterMessage('');
            }}
            placeholder="Your email address"
            aria-label="Your email address"
            required
          />
          <button type="submit" className="button button-primary">
            Count me in <ArrowRight size={16} />
          </button>

          {newsletterMessage && (
            <p className="newsletter-feedback" role="status">
              {newsletterMessage}
            </p>
          )}
        </form>
      </section>
    </>
  );
}