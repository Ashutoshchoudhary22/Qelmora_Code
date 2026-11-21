import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Mail } from 'lucide-react';
import { api } from '../api/client';

const DEFAULT_NEWSLETTER_BG = '/profile/our-story-golden-silk.png';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  const { data: bandCfg } = useQuery({
    queryKey: ['content', 'newsletter_band'],
    queryFn: async () => {
      try {
        return (await api.get('/content/newsletter_band')).data;
      } catch {
        return null;
      }
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const bgUrl = bandCfg?.imageUrl || DEFAULT_NEWSLETTER_BG;
  const hasCustomBg = Boolean(bandCfg?.imageUrl);

  function submit(e) {
    e.preventDefault();
    if (!email.includes('@')) return;
    setDone(true);
  }

  return (
    <section
      className={`site-newsletter-premium relative overflow-hidden border-y border-[rgb(74_52_38/0.12)] ${
        hasCustomBg ? 'site-newsletter-premium--custom' : ''
      }`}
    >
      <div className="site-newsletter-premium-bg" style={{ backgroundImage: `url(${bgUrl})` }} aria-hidden />
      <div className="site-newsletter-premium-scrim" aria-hidden />
      <div className="site-newsletter-premium-inner site-container py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="site-newsletter-eyebrow">
            <span>Private list</span>
          </p>
          <h2 className="site-newsletter-title font-display">
            Join the <em>inner circle</em>
          </h2>
          <p className="site-newsletter-sub">
            First access to drops, archive sales, and stories from the atelier.
          </p>
          {done ? (
            <p className="site-newsletter-done">You&apos;re on the list. Welcome in.</p>
          ) : (
            <form onSubmit={submit} className="site-newsletter-form">
              <label className="site-newsletter-field">
                <Mail size={18} strokeWidth={1.65} className="site-newsletter-field-icon" aria-hidden />
                <span className="sr-only">Email address</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="site-newsletter-input"
                />
              </label>
              <button type="submit" className="site-newsletter-submit">
                Subscribe
                <ArrowRight size={18} strokeWidth={2} aria-hidden />
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}