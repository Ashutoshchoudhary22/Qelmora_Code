import { Link, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';

export function AuthLayout() {
  const { data } = useQuery({
    queryKey: ['content', 'login_banner'],
    queryFn: async () => {
      try {
        return (await api.get('/content/login_banner')).data;
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
  });

  const imageUrl = data?.imageUrl;
  const mediaType = data?.mediaType || 'image';
  const eyebrow = data?.eyebrow?.trim();
  const headline = data?.headline?.trim();

  return (
    <div className="flex min-h-screen bg-stone-50 text-stone-900">
      <aside className="relative hidden min-h-screen w-[min(42vw,520px)] shrink-0 lg:block">
        {imageUrl ? (
          mediaType === 'video' ? (
            <video
              src={imageUrl}
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-stone-800 via-black to-stone-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/40" />
        <div className="relative flex h-full min-h-screen flex-col justify-between p-8 text-white xl:p-12">
          <Link to="/" className="font-display text-lg tracking-[0.28em] text-white">
            QELMORA
          </Link>
          {(eyebrow || headline) && (
            <div className="pb-6">
              {eyebrow && <p className="text-[10px] font-medium uppercase tracking-[0.45em] text-white/85">{eyebrow}</p>}
              {headline && (
                <p className="font-display mt-4 max-w-sm text-3xl font-light leading-snug tracking-wide xl:text-4xl">{headline}</p>
              )}
            </div>
          )}
        </div>
      </aside>

      <main className="flex min-h-screen flex-1 flex-col justify-center px-5 py-12 sm:px-10 lg:px-14">
        <Link to="/" className="mb-8 font-display text-sm tracking-[0.28em] text-stone-400 lg:hidden">
          QELMORA
        </Link>
        <div className="auth-panel mx-auto w-full max-w-md">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
