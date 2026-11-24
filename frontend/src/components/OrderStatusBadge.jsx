const STATUS_META = {
  placed: { tone: 'placed', label: 'Placed' },
  confirmed: { tone: 'confirmed', label: 'Confirmed' },
  packed: { tone: 'packed', label: 'Packed' },
  shipped: { tone: 'shipped', label: 'Shipped' },
  delivered: { tone: 'delivered', label: 'Delivered' },
  cancelled: { tone: 'cancelled', label: 'Cancelled' },
};

export function getOrderStatusMeta(status) {
  const key = String(status || 'placed').toLowerCase();
  if (STATUS_META[key]) return { ...STATUS_META[key], key };
  const label = key ? key.charAt(0).toUpperCase() + key.slice(1) : 'Placed';
  return { tone: 'placed', label, key };
}

export function OrderStatusBadge({ status, className = '' }) {
  const { tone, label } = getOrderStatusMeta(status);
  return (
    <span className={`account-order-status account-order-status--${tone} ${className}`.trim()}>
      <span className="account-order-status-dot" aria-hidden />
      {label}
    </span>
  );
}