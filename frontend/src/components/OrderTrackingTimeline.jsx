import { Check } from 'lucide-react';

const TRACK_STEPS = [
  { key: 'placed', label: 'Order placed', sub: 'We received your order' },
  { key: 'confirmed', label: 'Confirmed', sub: 'Your order is confirmed' },
  { key: 'packed', label: 'Packed', sub: 'Items are packed and ready' },
  { key: 'shipped', label: 'On the way', sub: 'Shipped with our courier partner' },
  { key: 'delivered', label: 'Delivered', sub: 'Your order has been delivered' },
];

const STATUS_ORDER = TRACK_STEPS.map((s) => s.key);

function formatTrackDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function stepIndex(status) {
  const key = String(status || 'placed').toLowerCase();
  const idx = STATUS_ORDER.indexOf(key);
  return idx >= 0 ? idx : 0;
}

export function OrderTrackingTimeline({ orderStatus, createdAt, updatedAt }) {
  const status = String(orderStatus || 'placed').toLowerCase();
  const isCancelled = status === 'cancelled';
  const currentIdx = isCancelled ? -1 : stepIndex(status);

  if (isCancelled) {
    return (
      <div className="order-track order-track--cancelled">
        <p className="order-track-cancel-title">Order cancelled</p>
        <p className="order-track-cancel-meta">
          {formatTrackDate(updatedAt || createdAt) || 'This order will not be shipped.'}
        </p>
      </div>
    );
  }

  return (
    <ol className="order-track">
      {TRACK_STEPS.map((step, index) => {
        let state = 'upcoming';
        if (index < currentIdx) state = 'complete';
        else if (index === currentIdx) state = 'current';

        let when = '';
        let whenIso = '';
        if (step.key === 'placed' && state !== 'upcoming') {
          when = formatTrackDate(createdAt);
          whenIso = createdAt;
        } else if (state === 'current') {
          when = formatTrackDate(updatedAt || createdAt);
          whenIso = updatedAt || createdAt;
        } else if (state === 'complete' && step.key === 'delivered') {
          when = formatTrackDate(updatedAt || createdAt);
          whenIso = updatedAt || createdAt;
        }

        const isDelivered = step.key === 'delivered' && state !== 'upcoming';

        return (
          <li key={step.key} className={`order-track-step order-track-step--${state}`}>
            <span className="order-track-rail" aria-hidden>
              <span className="order-track-node">
                {state === 'complete' && <Check size={12} strokeWidth={2.5} />}
              </span>
            </span>
            <div className="order-track-copy">
              <div className="order-track-head">
                <p className="order-track-title">
                  {step.label}
                  {isDelivered && state !== 'upcoming' && (
                    <Check className="order-track-title-check" size={16} strokeWidth={2.5} aria-hidden />
                  )}
                </p>
                {when ? <span className="order-track-sep">|</span> : null}
                {when ? (
                  <time className="order-track-time" dateTime={whenIso}>
                    {when}
                  </time>
                ) : null}
              </div>
              {state === 'current' && step.sub && <p className="order-track-sub">{step.sub}</p>}
              {step.key === 'delivered' && (state === 'complete' || state === 'current') && (
                <p className="order-track-sub">{step.sub}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}