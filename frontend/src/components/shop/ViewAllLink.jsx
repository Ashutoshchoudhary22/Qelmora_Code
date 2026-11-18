import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const PREVIEW_LIMIT = 4;

export function shouldShowViewAll(total) {
  return Number(total) > PREVIEW_LIMIT;
}

export function ViewAllLink({ to, total, className = '' }) {
  if (!shouldShowViewAll(total)) return null;
  return (
    <Link
      to={to}
      className={`group view-all-link inline-flex shrink-0 items-center gap-2.5 rounded-sm border border-white/15 bg-white/[0.04] px-3.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm transition duration-300 hover:border-q-accent/55 hover:bg-q-accent/[0.08] hover:shadow-[0_0_28px_-10px_rgba(232,149,74,0.55)] ${className}`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-100 transition group-hover:text-q-accent">
        View all
      </span>
      <span
        aria-hidden
        className="rounded-full border border-q-accent/25 bg-q-accent/10 px-2 py-0.5 text-[9px] font-semibold tabular-nums tracking-wide text-q-accent-soft transition group-hover:border-q-accent group-hover:bg-q-accent group-hover:text-q-black"
      >
        {total}
      </span>
      <ArrowRight
        size={14}
        strokeWidth={2}
        className="text-stone-500 transition duration-300 group-hover:translate-x-0.5 group-hover:text-q-accent"
        aria-hidden
      />
    </Link>
  );
}