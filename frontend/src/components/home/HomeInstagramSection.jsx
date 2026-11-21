import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpRight,
  Grid3X3,
  Heart,
  Instagram,
  LayoutGrid,
  MessageCircle,
  Shirt,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { api } from '../../api/client';
import { BRAND_NAME } from '../../lib/brand';

const DEFAULT_INSTAGRAM_BG = '/profile/our-story-golden-silk.png';

const FILTERS = [
  { id: 'all', label: 'All Posts', icon: LayoutGrid },
  { id: 'hoodies', label: 'Hoodies', icon: Grid3X3 },
  { id: 'tees', label: 'T-Shirts', icon: Shirt },
  { id: 'sweatshirts', label: 'Sweatshirts', icon: Sparkles },
  { id: 'customer', label: 'Customer Looks', icon: Users },
  { id: 'reviews', label: 'Reviews', icon: Star },
];

const CATEGORY_SLUGS = ['hoodies', 'tees', 'sweatshirts', 'customer', 'reviews'];

const INSTA_REVIEWS = [
  { handle: '@harsh.official', quote: 'Quality is top-notch! 🔥', initial: 'H', hue: 28 },
  { handle: '@simran.wears', quote: 'Perfect fit, totally obsessed!', initial: 'S', hue: 12 },
  { handle: '@rahul.ftw', quote: 'Packaging was amazing!', initial: 'R', hue: 220 },
];

function postCategory(id) {
  return CATEGORY_SLUGS[Number(id) % CATEGORY_SLUGS.length];
}

function postStats(id) {
  const n = Number(id) || 1;
  return {
    likes: 420 + (n * 41) % 980,
    comments: 18 + (n * 7) % 72,
  };
}

function InstagramPostCard({ post, profileLink }) {
  const { likes, comments } = postStats(post.id);
  const href = post.linkUrl || profileLink;

  return (
    <a href={href} target="_blank" rel="noreferrer" className="home-instagram-card">
      <span className="home-instagram-card-ig" aria-hidden>
        <Instagram size={14} strokeWidth={1.75} />
      </span>
      {post.resourceType === 'video' ? (
        <video
          src={post.secureUrl}
          className="home-instagram-card-media"
          muted
          loop
          playsInline
          autoPlay
        />
      ) : (
        <img src={post.secureUrl} alt="" className="home-instagram-card-media" loading="lazy" />
      )}
      <PostStats likes={likes} comments={comments} />
    </a>
  );
}

export function HomeInstagramSection() {
  const [activeFilter, setActiveFilter] = useState('all');

  const { data: instagramMeta } = useQuery({
    queryKey: ['content', 'instagram'],
    queryFn: async () => (await api.get('/content/instagram')).data,
  });

  const { data: bandCfg } = useQuery({
    queryKey: ['content', 'instagram_band'],
    queryFn: async () => {
      try {
        return (await api.get('/content/instagram_band')).data;
      } catch {
        return null;
      }
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const { data: instagramFeed } = useQuery({
    queryKey: ['instagram'],
    queryFn: async () => (await api.get('/instagram')).data,
  });

  const bgUrl = bandCfg?.imageUrl || DEFAULT_INSTAGRAM_BG;
  const profileLink = instagramMeta?.ctaLink || 'https://instagram.com/qelmora';
  const subtitle =
    instagramMeta?.body?.trim() ||
    'Latest drops, real looks & love from our community.';

  const filteredPosts = useMemo(() => {
    const items = instagramFeed?.items || [];
    if (!items.length) return [];
    if (activeFilter === 'all') return items;
    return items.filter((post) => postCategory(post.id) === activeFilter);
  }, [instagramFeed?.items, activeFilter]);

  const displayPosts = filteredPosts.length ? filteredPosts : instagramFeed?.items || [];

  const loopPosts = useMemo(() => {
    if (!displayPosts.length) return [];
    return [...displayPosts, ...displayPosts];
  }, [displayPosts]);

  const marqueeDuration = `${Math.max(28, loopPosts.length * 2.8)}s`;

  return (
    <section className="home-instagram-premium relative overflow-hidden">
      <div className="home-instagram-premium-bg" style={{ backgroundImage: `url(${bgUrl})` }} aria-hidden />
      <div className="home-instagram-premium-scrim" aria-hidden />

      <div className="home-instagram-premium-inner site-container relative z-[2] py-14 md:py-20 lg:py-24">
        <header className="home-instagram-premium-header">
          <p className="home-instagram-premium-brand font-display">{BRAND_NAME}</p>
          <h2 className="home-instagram-premium-title font-display">
            From Our <em className="home-instagram-premium-script">Instagram</em>
          </h2>
          <p className="home-instagram-premium-subtitle">{subtitle}</p>
        </header>

        <div className="home-instagram-filters" role="tablist" aria-label="Filter Instagram posts">
          {FILTERS.map(({ id, label, icon: Icon }) => {
            const active = activeFilter === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`home-instagram-filter${active ? ' home-instagram-filter--active' : ''}`}
                onClick={() => setActiveFilter(id)}
              >
                <Icon size={14} strokeWidth={1.75} aria-hidden />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        <div className="home-instagram-carousel" key={activeFilter}>
          <div className="home-instagram-marquee-viewport">
            {loopPosts.length > 0 ? (
              <div
                className="home-instagram-marquee-track"
                style={{ '--instagram-marquee-duration': marqueeDuration }}
              >
                {loopPosts.map((post, i) => (
                  <InstagramPostCard key={`${post.id}-${i}`} post={post} profileLink={profileLink} />
                ))}
              </div>
            ) : (
              <div className="home-instagram-marquee-track home-instagram-marquee-track--static">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="home-instagram-card home-instagram-card--placeholder" aria-hidden />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="home-instagram-proof">
          <div className="home-instagram-proof-head">
            <p className="font-display">What Our Insta Fam Says</p>
          </div>
          <ul className="home-instagram-proof-list">
            {INSTA_REVIEWS.map((review) => (
              <li key={review.handle} className="home-instagram-proof-item">
                <span
                  className="home-instagram-avatar"
                  style={{ background: `hsl(${review.hue} 38% 42%)` }}
                  aria-hidden
                >
                  {review.initial}
                </span>
                <div>
                  <p className="home-instagram-proof-handle">{review.handle}</p>
                  <p className="home-instagram-proof-stars" aria-label="5 out of 5 stars">
                    {'★★★★★'}
                  </p>
                  <p className="home-instagram-proof-quote">{review.quote}</p>
                </div>
              </li>
            ))}
          </ul>
          <a
            href={profileLink}
            target="_blank"
            rel="noreferrer"
            className="home-instagram-follow"
          >
            <Instagram size={16} strokeWidth={1.75} aria-hidden />
            <span>{instagramMeta?.ctaLabel || 'Follow Us on Instagram'}</span>
            <ArrowUpRight size={16} strokeWidth={1.75} aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}

function PostStats({ likes, comments }) {
  return (
    <div className="home-instagram-card-stats">
      <span>
        <Heart size={12} fill="currentColor" aria-hidden />
        {likes}
      </span>
      <span>
        <MessageCircle size={12} aria-hidden />
        {comments}
      </span>
    </div>
  );
}