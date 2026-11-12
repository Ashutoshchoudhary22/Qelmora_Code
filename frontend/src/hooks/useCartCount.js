import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function useCartCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['cart-summary', user?.id],
    queryFn: async () => (await api.get('/cart/summary')).data,
    enabled: !!user,
    staleTime: 10_000,
    placeholderData: { itemCount: 0 },
  });
}
