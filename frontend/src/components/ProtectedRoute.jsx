import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { user, booting } = useAuth();
  const location = useLocation();
  if (booting) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm tracking-widest text-stone-500">
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

export function AdminRoute({ children }) {
  const { user, booting, isAdmin } = useAuth();
  const location = useLocation();
  if (booting) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm tracking-widest text-stone-500">
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}
