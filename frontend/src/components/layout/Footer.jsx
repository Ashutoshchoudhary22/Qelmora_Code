import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Facebook, Instagram, Mail, Twitter, Youtube } from 'lucide-react';
import { api } from '../../api/client';

function PinterestIcon({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.719-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.333 1.367-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z" />
    </svg>
  );
}

const SOCIALS = [
  { label: 'Instagram', href: 'https://instagram.com/qelmora', icon: Instagram },
  { label: 'YouTube', href: 'https://youtube.com', icon: Youtube },
  { label: 'Facebook', href: 'https://facebook.com', icon: Facebook },
  { label: 'X', href: 'https://x.com/qelmora', icon: Twitter },
  { label: 'Pinterest', href: 'https://pinterest.com', icon: PinterestIcon },
];

export function Footer() {
  const { data: footerCfg } = useQuery({
    queryKey: ['content', 'site_footer'],
    queryFn: async () => {
      try {
        return (await api.get('/content/site_footer')).data;
      } catch {
        return null;
      }
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const bgUrl = footerCfg?.imageUrl || '';
  const hasCustomBg = Boolean(bgUrl);

  return (
    <footer
      className={`site-footer site-footer-premium relative overflow-hidden border-t border-[rgb(201_168_108/0.25)] ${
        hasCustomBg ? 'site-footer--has-bg' : 'site-footer-premium--default-bg'
      }`}
    >
      {hasCustomBg && (
        <>
          <div className="site-footer-bg" style={{ backgroundImage: `url(${bgUrl})` }} aria-hidden />
          <div className="site-footer-scrim" aria-hidden />
        </>
      )}
      <div className="site-footer-inner site-container py-14 md:py-16">
        <div className="site-footer-columns">
          <div className="site-footer-col site-footer-col--brand">
            <p className="site-footer-logo font-display">QELMORA®</p>
            <p className="site-footer-tagline">
              Elevated essentials with a quiet edge. Designed in India for a world that values intention over noise.
            </p>
            <div className="site-footer-socials">
              {SOCIALS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="site-footer-social-btn"
                  aria-label={label}
                >
                  {label === 'Pinterest' ? (
                    <Icon size={17} />
                  ) : (
                    <Icon size={17} strokeWidth={1.65} />
                  )}
                </a>
              ))}
            </div>
          </div>

          <div className="site-footer-col">
            <p className="site-footer-heading">Explore</p>
            <ul className="site-footer-links">
              <li>
                <Link to="/shop/men">Men</Link>
              </li>
              <li>
                <Link to="/shop/women">Women</Link>
              </li>
              <li>
                <Link to="/shop/men#new-arrivals">Men — New arrivals</Link>
              </li>
              <li>
                <Link to="/shop/women#new-arrivals">Women — New arrivals</Link>
              </li>
              <li>
                <Link to="/collections">Nowhere Else</Link>
              </li>
            </ul>
          </div>

          <div className="site-footer-col">
            <p className="site-footer-heading">Quick links</p>
            <ul className="site-footer-links">
              <li>
                <Link to="/about">Our story</Link>
              </li>
              <li>
                <Link to="/contact">Size guide</Link>
              </li>
              <li>
                <Link to="/contact">Shipping &amp; returns</Link>
              </li>
              <li>
                <Link to="/contact">FAQs</Link>
              </li>
            </ul>
          </div>

          <div className="site-footer-col">
            <p className="site-footer-heading">Get in touch</p>
            <ul className="site-footer-contact">
              <li>
                <a href="mailto:hello@qelmora.com" className="site-footer-contact-row">
                  <span className="site-footer-contact-icon">
                    <Mail size={16} strokeWidth={1.65} aria-hidden />
                  </span>
                  hello@qelmora.com
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com/qelmora"
                  target="_blank"
                  rel="noreferrer"
                  className="site-footer-contact-row"
                >
                  <span className="site-footer-contact-icon">
                    <Instagram size={16} strokeWidth={1.65} aria-hidden />
                  </span>
                  @QELMORA
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="site-footer-copy">
          © {new Date().getFullYear()} QELMORA · All rights reserved
        </div>
      </div>
    </footer>
  );
}