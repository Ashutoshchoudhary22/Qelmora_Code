import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';

export function AnnouncementBar() {
  const { data } = useQuery({
    queryKey: ['banners', 'announcement'],
    queryFn: async () => (await api.get('/banners?placement=announcement')).data,
  });
  const banner = data?.items?.[0];
  const text = banner?.title || 'Complimentary shipping on orders above ₹4,999 · Crafted in limited runs';

  return (
    <div className="border-b border-white/10 bg-[#0c0c0c] py-2.5 text-center text-[10px] font-medium uppercase tracking-[0.35em] text-stone-400">
      {text}
    </div>
  );
}
