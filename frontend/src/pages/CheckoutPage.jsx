import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Banknote,
  CreditCard,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShoppingCart,
} from 'lucide-react';
import { api } from '../api/client';
import { AddressForm } from '../components/AddressForm';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { formatInr } from '../lib/money';

const CHECKOUT_SILK = '/profile/our-story-golden-silk.png';

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function formatAddressLine(a) {
  if (!a) return '';
  const parts = [a.line1, a.line2, [a.city, a.state, a.postalCode].filter(Boolean).join(', ')].filter(Boolean);
  return parts.join(', ');
}

function CheckoutForm() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [addressId, setAddressId] = useState('');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [error, setError] = useState('');

  const { data: cart } = useQuery({ queryKey: ['cart'], queryFn: async () => (await api.get('/cart')).data });
  const { data: addresses, isLoading: loadingAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => (await api.get('/addresses')).data,
    enabled: Boolean(user),
  });

  const items = addresses?.items || [];

  const selectedAddress = useMemo(
    () => items.find((a) => String(a.id) === String(addressId)) || null,
    [items, addressId]
  );

  useEffect(() => {
    if (!items.length || addressId) return;
    const preferred = items.find((a) => a.isDefault) || items[0];
    if (preferred) setAddressId(String(preferred.id));
  }, [items, addressId]);

  useEffect(() => {
    if (loadingAddresses) return;
    setShowAddAddress(items.length === 0);
  }, [items.length, loadingAddresses]);

  const placeCod = useMutation({
    mutationFn: () => api.post('/orders', { addressId: Number(addressId), paymentMethod: 'cod' }),
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: ['cart'] });
      qc.invalidateQueries({ queryKey: ['cart-summary'] });
      navigate(`/account/orders/${data.orderNumber}`);
    },
    onError: (e) => setError(e.response?.data?.message || 'Checkout failed'),
  });

  async function payOnline() {
    setError('');
    try {
      const { data: orderData } = await api.post('/payments/razorpay/create-order', {
        addressId: Number(addressId),
      });
      const { data: keyData } = await api.get('/payments/razorpay-key');
      const ok = await loadRazorpay();
      if (!ok) throw new Error('Could not load Razorpay');

      const rzp = new window.Razorpay({
        key: keyData.keyId,
        amount: Math.round(orderData.amount * 100),
        currency: orderData.currency,
        name: 'QELMORA',
        description: `Order ${orderData.orderNumber}`,
        order_id: orderData.razorpayOrderId,
        handler: async (response) => {
          await api.post('/payments/razorpay/verify', {
            orderId: orderData.orderId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          qc.invalidateQueries({ queryKey: ['cart'] });
          navigate(`/account/orders/${orderData.orderNumber}`);
        },
        theme: { color: '#e8954a' },
      });
      rzp.on('payment.failed', () => setError('Payment failed. Your order remains pending.'));
      rzp.open();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Online payment unavailable');
    }
  }

  function placeOrder() {
    if (!addressId) return setError('Select or add a delivery address');
    if (paymentMethod === 'cod') placeCod.mutate();
    else payOnline();
  }

  function onAddressCreated(created) {
    qc.invalidateQueries({ queryKey: ['addresses'] });
    if (created?.id) setAddressId(String(created.id));
    setShowAddAddress(false);
    setError('');
  }

  const phoneDisplay = selectedAddress?.phone || '—';
  const emailDisplay = user?.email || '';

  return (
    <div className="checkout-layout">
      <div>
        <section className="checkout-card">
          <div className="checkout-card-head">
            <p className="checkout-card-title">
              <MapPin size={18} aria-hidden />
              Delivery Address
            </p>
            <span className="checkout-card-hint">Enter your shipping address</span>
          </div>

          {loadingAddresses ? (
            <p className="text-sm text-stone-500">Loading addresses…</p>
          ) : (
            <>
              {!showAddAddress && items.length > 0 && (
                <div className="checkout-address-pick">
                  {items.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className={`checkout-address-chip ${
                        String(addressId) === String(a.id) ? 'checkout-address-chip--active' : ''
                      }`}
                      onClick={() => setAddressId(String(a.id))}
                    >
                      <span className="checkout-address-chip-title">
                        {a.fullName || user?.name || 'Address'}
                        {a.isDefault ? ' · Default' : ''}
                      </span>
                      <span className="checkout-address-chip-line">{formatAddressLine(a)}</span>
                      {a.phone && <span className="checkout-address-chip-meta">{a.phone}</span>}
                    </button>
                  ))}
                </div>
              )}

              {items.length > 0 && !showAddAddress && (
                <button type="button" className="checkout-link-btn" onClick={() => setShowAddAddress(true)}>
                  + Add new address
                </button>
              )}

              {showAddAddress && (
                <div className="checkout-address-form">
                  <p className="mb-3 text-xs text-stone-500">
                    {items.length ? 'Save a new delivery address' : 'Add your delivery address to continue'}
                  </p>
                  <AddressForm
                    initialFullName={user?.name || ''}
                    isDefault={items.length === 0}
                    submitLabel="Save & use this address"
                    onSuccess={onAddressCreated}
                    onCancel={items.length > 0 ? () => setShowAddAddress(false) : undefined}
                  />
                </div>
              )}
            </>
          )}
        </section>

        <section className="checkout-card">
          <div className="checkout-card-head">
            <p className="checkout-card-title">
              <Phone size={18} aria-hidden />
              Contact Details
            </p>
            <span className="checkout-card-hint">We&apos;ll use this to update your order</span>
          </div>

          <div className="checkout-contact-grid">
            <div className="checkout-field">
              <span className="checkout-field-icon">
                <Phone size={18} aria-hidden />
              </span>
              <span className="checkout-field-body">
                <span className="checkout-field-label">
                  Phone Number <span className="req">*</span>
                </span>
                <span className="checkout-field-value">{phoneDisplay}</span>
              </span>
            </div>

            <div className="checkout-field">
              <span className="checkout-field-icon">
                <Mail size={18} aria-hidden />
              </span>
              <span className="checkout-field-body">
                <span className="checkout-field-label">Email Address (Optional)</span>
                <span className="checkout-field-value">{emailDisplay || 'you@email.com'}</span>
              </span>
            </div>
          </div>
        </section>

        <section className="checkout-card">
          <div className="checkout-card-head">
            <p className="checkout-card-title">
              <CreditCard size={18} aria-hidden />
              Payment
            </p>
            <span className="checkout-card-hint">Choose how you want to pay</span>
          </div>
          <div className="checkout-pay-options">
            <label
              className={`checkout-pay-option ${paymentMethod === 'cod' ? 'checkout-pay-option--active' : ''}`}
            >
              <input
                type="radio"
                name="payment"
                className="sr-only"
                checked={paymentMethod === 'cod'}
                onChange={() => setPaymentMethod('cod')}
              />
              <span className="checkout-pay-radio" aria-hidden />
              <span className="checkout-pay-icon-wrap">
                <Banknote size={20} strokeWidth={1.75} aria-hidden />
              </span>
              <span className="checkout-pay-copy">
                <span className="checkout-pay-name">Cash on delivery</span>
                <span className="checkout-pay-desc">Pay in cash when your order is delivered</span>
              </span>
            </label>
            <label
              className={`checkout-pay-option ${paymentMethod === 'online' ? 'checkout-pay-option--active' : ''}`}
            >
              <input
                type="radio"
                name="payment"
                className="sr-only"
                checked={paymentMethod === 'online'}
                onChange={() => setPaymentMethod('online')}
              />
              <span className="checkout-pay-radio" aria-hidden />
              <span className="checkout-pay-icon-wrap">
                <CreditCard size={20} strokeWidth={1.75} aria-hidden />
              </span>
              <span className="checkout-pay-copy">
                <span className="checkout-pay-name">Razorpay</span>
                <span className="checkout-pay-desc">UPI, debit / credit card &amp; net banking</span>
              </span>
            </label>
          </div>
        </section>

        {error && <p className="checkout-error">{error}</p>}
      </div>

      <aside className="checkout-summary">
        <div className="checkout-summary-head">
          <ShoppingCart size={20} strokeWidth={1.75} aria-hidden />
          <h2>Order Summary</h2>
        </div>
        <div className="checkout-summary-body">
          <p className="checkout-summary-label">Total Amount</p>
          <p className="checkout-summary-total">{formatInr(cart?.total || 0)}</p>
          <p className="checkout-summary-note">(Incl. of all taxes)</p>
          <p className="checkout-summary-items">{cart?.itemCount || 0} items in your bag</p>
          <div className="checkout-summary-divider" />
          <button
            type="button"
            disabled={placeCod.isPending || !addressId}
            onClick={placeOrder}
            className="checkout-place-order"
          >
            <Lock size={16} aria-hidden />
            Place Order
            <ArrowRight size={16} aria-hidden />
          </button>
        </div>
      </aside>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <main className="checkout-page">
        <div className="checkout-page-silk" style={{ backgroundImage: `url(${CHECKOUT_SILK})` }} aria-hidden />
        <div className="checkout-page-scrim" aria-hidden />
        <div className="checkout-page-content site-container py-10 md:py-14">
          <nav className="checkout-crumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span className="checkout-crumb-sep" aria-hidden>
              ›
            </span>
            <strong>Checkout</strong>
          </nav>
          <h1 className="checkout-title">Checkout</h1>
          <p className="checkout-subtitle">Enter your details to complete your order</p>
          <div className="mt-2">
            <CheckoutForm />
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}