import { Link } from 'react-router-dom';
import { Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="site-footer border-t border-white/10 bg-[#070707]">
      <div className="site-container grid gap-12 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-3xl tracking-[0.2em] text-stone-100">QELMORA</p>
          <p className="mt-4 max-w-sm text-sm leading-7 text-stone-500">
            Elevated essentials with a quiet edge. Designed in India for a world that values intention over noise.
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-q-accent">Explore</p>
          <ul className="mt-4 space-y-2 text-sm text-stone-400">
            <li>
              <Link to="/shop/men" className="hover:text-stone-200">
                Men
              </Link>
            </li>
            <li>
              <Link to="/shop/women" className="hover:text-stone-200">
                Women
              </Link>
            </li>
            <li>
              <Link to="/shop/men#new-arrivals" className="hover:text-stone-200">
                Men — New arrivals
              </Link>
            </li>
            <li>
              <Link to="/shop/women#new-arrivals" className="hover:text-stone-200">
                Women — New arrivals
              </Link>
            </li>
            <li>
              <Link to="/collections" className="hover:text-stone-200">
                Nowhere Else
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-q-accent">Client care</p>
          <ul className="mt-4 space-y-2 text-sm text-stone-400">
            <li>
              <Link to="/contact" className="hover:text-stone-200">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-stone-200">
                Our story
              </Link>
            </li>
            <li>
              <a href="mailto:hello@qelmora.com" className="hover:text-stone-200">
                hello@qelmora.com
              </a>
            </li>
          </ul>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-stone-500 hover:text-q-accent"
          >
            <Instagram size={16} /> @qelmora
          </a>
        </div>
      </div>
      <div className="border-t border-white/5 py-6 text-center text-[10px] uppercase tracking-[0.35em] text-stone-600">
        © {new Date().getFullYear()} QELMORA · All rights reserved
      </div>
    </footer>
  );
}
