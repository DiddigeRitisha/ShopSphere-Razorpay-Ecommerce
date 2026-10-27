
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Package,
  XCircle,
  LoaderCircle,
} from 'lucide-react';
import { api } from '../api';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState('');
  const [message, setMessage] = useState('');

  const loadOrders = useCallback(async () => {
    try {
      setError('');
      const data = await api('/orders/my');
      setOrders(data.orders || []);
    } catch (e) {
      setError(e.message || 'Unable to load your orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function handleCancel(order) {
    const confirmed = window.confirm(
      `Are you sure you want to cancel order #${order._id
        .slice(-8)
        .toUpperCase()}?`
    );

    if (!confirmed) return;

    setCancellingId(order._id);
    setError('');
    setMessage('');

    try {
      // Uses the existing API helper so your project's authentication
      // headers and base URL configuration are preserved.
      const result = await api(`/orders/${order._id}/cancel`, {
        method: 'PATCH',
      });

      setMessage(result.message || 'Order cancelled successfully.');

      // Refresh the order status from MongoDB.
      await loadOrders();
    } catch (e) {
      setError(e.message || 'Unable to cancel this order.');
    } finally {
      setCancellingId('');
    }
  }

  function canCancel(order) {
    return (
      !['cancelled', 'delivered', 'shipped'].includes(
        order.orderStatus
      ) &&
      order.paymentStatus !== 'paid' &&
      order.paymentStatus !== 'refunded'
    );
  }

  if (loading) {
    return (
      <div className="container page-wrap">
        <p>Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="container page-wrap">
      <div className="page-heading">
        <span className="eyebrow">YOUR SHOPSPHERE</span>
        <h1>
          Order <em>history.</em>
        </h1>
        <p>Everything you've ordered, all in one place.</p>
      </div>

      {error && <div className="alert error">{error}</div>}

      {message && (
        <div className="alert success" role="status">
          {message}
        </div>
      )}

      {!error && orders.length === 0 ? (
        <div className="empty-state">
          <Package size={38} />
          <h2>No orders just yet.</h2>
          <p>Your next great find is waiting.</p>
          <Link to="/" className="button button-primary">
            Start shopping <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((o) => (
            <article className="order-card" key={o._id}>
              <div className="order-card-top">
                <div>
                  <small>ORDER NUMBER</small>
                  <strong>
                    #{o._id.slice(-8).toUpperCase()}
                  </strong>
                </div>

                <span
                  className={`status status-${o.orderStatus}`}
                >
                  {o.orderStatus.replaceAll('_', ' ')}
                </span>
              </div>

              <div className="order-card-content">
                <div className="order-thumbs">
                  {o.items.slice(0, 4).map((item, index) => (
                    <img
                      key={item.product || index}
                      src={item.image}
                      alt={item.name}
                    />
                  ))}
                </div>

                <div className="order-meta">
                  <span>
                    {new Date(o.createdAt).toLocaleDateString(
                      'en-IN',
                      {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      }
                    )}
                  </span>

                  <span>
                    {o.items.reduce(
                      (total, item) => total + item.quantity,
                      0
                    )}{' '}
                    items ·{' '}
                    {o.paymentMethod === 'razorpay'
                      ? 'Razorpay'
                      : 'Cash on delivery'}
                  </span>
                </div>

                <strong className="order-total">
                  ₹
                  {Number(o.total).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </strong>

                <Link
                  to={`/order-success/${o._id}`}
                  className="icon-button"
                  title="View order"
                  aria-label="View order"
                >
                  <ArrowRight size={18} />
                </Link>
              </div>

              <div className="order-payment">
                Payment:{' '}
                <strong>
                  {(o.paymentStatus || 'pending').replaceAll(
                    '_',
                    ' '
                  )}
                </strong>
              </div>

              <div className="order-actions">
                <Link
                  to={`/order-success/${o._id}`}
                  className="button button-secondary"
                >
                  View order
                </Link>

                {canCancel(o) && (
                  <button
                    type="button"
                    className="button cancel-order-btn"
                    onClick={() => handleCancel(o)}
                    disabled={cancellingId === o._id}
                  >
                    {cancellingId === o._id ? (
                      <>
                        <LoaderCircle size={16} />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <XCircle size={16} />
                        Cancel Order
                      </>
                    )}
                  </button>
                )}

                {o.orderStatus === 'cancelled' && (
                  <span className="cancelled-label">
                    <XCircle size={16} />
                    Order cancelled
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}