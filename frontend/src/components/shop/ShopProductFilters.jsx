import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import {
  mergePriceFacets,
  mergeSizeFacets,
  parseCsvParam,
  setCsvParam,
  hasActiveFilters,
} from '../../lib/shopListFilters';

function FilterSection({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="shop-filter-divider border-b py-4 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="shop-filter-section-title text-[15px] font-semibold leading-snug">{title}</span>
        <ChevronDown
          size={16}
          className={`shop-filter-chevron shrink-0 transition duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="mt-3 space-y-0.5">{children}</div>}
    </div>
  );
}

function FilterCheck({ id, label, count, checked, inputDisabled = false, muted = false, onChange, countRight = false }) {
  return (
    <label
      htmlFor={id}
      className={`shop-filter-row flex cursor-pointer items-center gap-3 py-2 text-[15px] leading-snug ${
        inputDisabled ? 'is-disabled' : ''
      } ${muted ? 'opacity-70' : ''}`}
    >
      <input
        id={id}
        type="checkbox"
        className="shop-filter-check h-4 w-4 shrink-0 rounded-[3px]"
        checked={checked}
        disabled={inputDisabled}
        onChange={onChange}
      />
      <span className="shop-filter-label min-w-0 flex-1 font-medium">{label}</span>
      {count != null && (
        <span
          className={`shop-filter-count shrink-0 tabular-nums font-medium ${countRight ? 'text-[14px]' : 'text-[13px]'}`}
        >
          ({count})
        </span>
      )}
    </label>
  );
}

export function ShopProductFilters({
  genderLabel,
  facets,
  showHighlightFilters = false,
  bandLocks = {},
  className = '',
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSizes = parseCsvParam(searchParams, 'sizes');
  const selectedColors = parseCsvParam(searchParams, 'colors');
  const selectedPrices = parseCsvParam(searchParams, 'prices');
  const highlightNew = searchParams.get('newArrival') === '1';
  const highlightFeatured = searchParams.get('featured') === '1';

  const sizes = useMemo(() => mergeSizeFacets(facets?.sizes), [facets?.sizes]);
  const priceBuckets = useMemo(() => mergePriceFacets(facets?.prices), [facets?.prices]);
  const colors = facets?.colors || [];

  const canClear = useMemo(
    () =>
      hasActiveFilters(searchParams, {
        bandFeatured: bandLocks.featured,
        bandNewArrival: bandLocks.newArrival,
      }),
    [searchParams, bandLocks]
  );

  function updateParams(mutator) {
    setSearchParams(mutator(new URLSearchParams(searchParams)), { replace: true });
  }

  function toggleValue(key, value) {
    const current = parseCsvParam(searchParams, key);
    const next = current.includes(value) ? current.filter((x) => x !== value) : [...current, value];
    updateParams((p) => setCsvParam(p, key, next));
  }

  function toggleFlag(key) {
    updateParams((p) => {
      if (p.get(key) === '1') p.delete(key);
      else p.set(key, '1');
      return p;
    });
  }

  function clearAll() {
    const next = new URLSearchParams();
    setSearchParams(next, { replace: true });
  }

  return (
    <aside className={`shop-filter-panel rounded-sm p-5 ${className}`}>
      <div className="shop-filter-divider flex items-center justify-between gap-3 border-b pb-4">
        <h2 className="shop-filter-heading text-base font-semibold tracking-wide">Filters</h2>
        {canClear && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-semibold uppercase tracking-[0.1em] text-q-accent transition hover:text-q-accent-soft"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="mt-1">
        <FilterSection title="Gender">
          <FilterCheck
            id="filter-gender"
            label={genderLabel}
            count={facets?.total}
            countRight
            checked
            inputDisabled
            muted
            onChange={() => {}}
          />
        </FilterSection>

        {showHighlightFilters && (
          <FilterSection title="Highlights" defaultOpen>
            {!bandLocks.newArrival && (
              <FilterCheck
                id="filter-new"
                label="New arrivals only"
                checked={highlightNew}
                onChange={() => toggleFlag('newArrival')}
              />
            )}
            {!bandLocks.featured && (
              <FilterCheck
                id="filter-featured"
                label="Best sellers only"
                checked={highlightFeatured}
                onChange={() => toggleFlag('featured')}
              />
            )}
          </FilterSection>
        )}

        <FilterSection title="Sizes">
          {sizes.map(({ value, count }) => (
            <FilterCheck
              key={value}
              id={`filter-size-${value}`}
              label={value}
              count={count}
              countRight
              checked={selectedSizes.includes(value)}
              inputDisabled={count === 0 && !selectedSizes.includes(value)}
              onChange={() => toggleValue('sizes', value)}
            />
          ))}
        </FilterSection>

        <FilterSection title="Price">
          {priceBuckets.map(({ id, label, count }) => (
            <FilterCheck
              key={id}
              id={`filter-price-${id}`}
              label={label}
              count={count}
              countRight
              checked={selectedPrices.includes(id)}
              inputDisabled={count === 0 && !selectedPrices.includes(id)}
              onChange={() => toggleValue('prices', id)}
            />
          ))}
        </FilterSection>

        {colors.length > 0 && (
          <FilterSection title="Colours">
            {colors.map(({ value, count }) => (
              <FilterCheck
                key={value}
                id={`filter-color-${value}`}
                label={value}
                count={count}
                countRight
                checked={selectedColors.includes(value)}
                inputDisabled={count === 0 && !selectedColors.includes(value)}
                onChange={() => toggleValue('colors', value)}
              />
            ))}
          </FilterSection>
        )}
      </div>
    </aside>
  );
}