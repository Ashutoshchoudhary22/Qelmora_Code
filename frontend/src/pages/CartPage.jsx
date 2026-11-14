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
      <main className="site-container py-14">
        <p className="text-sm text-stone-500">Opening your bag…</p>
      </main>
    </ProtectedRoute>
  );
}
