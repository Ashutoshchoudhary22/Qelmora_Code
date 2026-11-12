import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useCartDrawer } from '../context/CartDrawerContext';

export default function CartPage() {
  const navigate = useNavigate();
  const { openCart } = useCartDrawer();

  useEffect(() => {
    openCart();
    navigate('/', { replace: true });
  }, [openCart, navigate]);

  return (
    <ProtectedRoute>
      <main className="mx-auto max-w-7xl px-5 py-14 md:px-8">
        <p className="text-sm text-stone-500">Opening your bag…</p>
      </main>
    </ProtectedRoute>
  );
}
