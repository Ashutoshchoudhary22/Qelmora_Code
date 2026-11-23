import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CloudUpload, ImageIcon, Mail, Moon, Sun, X } from 'lucide-react';
import { api } from '../../api/client';
import { AdminOfferTileCard } from './AdminOfferTileCard';
import { uploadToCloudinary } from '../../lib/cloudinary';

const DARK_BAND_GUIDELINE = {
  label: 'Dark mode',
  value: 'Optional darker / muted image shown when shoppers use dark theme (falls back to light image if empty)',
};

const FOOTER_GUIDELINES = [
  { label: 'Size', value: '2400×900 px or wider (landscape)' },
  { label: 'Format', value: 'JPG, PNG, or WebP' },
  { label: 'File size', value: 'Under 800 KB' },
  { label: 'Tip', value: 'Dark or muted images keep footer links readable' },
  DARK_BAND_GUIDELINE,
];

const NEWSLETTER_GUIDELINES = [
  { label: 'Size', value: '2400×700 px or wider (landscape)' },
  { label: 'Format', value: 'JPG, PNG, or WebP' },
  { label: 'File size', value: 'Under 800 KB' },
  { label: 'Tip', value: 'Soft cream / gold textures work best behind the form' },
  DARK_BAND_GUIDELINE,
];

function SectionImageEditor({
  sectionKey,
  headline,
  title,
  hint,
  guidelines,
  previewHref,
  previewLabel,
  cloudFolder,
  saveLabel,
}) {
  const qc = useQueryClient();
  const [imageUrl, setImageUrl] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [darkImageUrl, setDarkImageUrl] = useState('');
  const [darkMediaType, setDarkMediaType] = useState('image');
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadingDark, setUploadingDark] = useState(false);

  const guidelineRows = guidelines.some((r) => r.label === 'Dark mode')
    ? guidelines
    : [...guidelines, DARK_BAND_GUIDELINE];

  const { data, isLoading } = useQuery({
    queryKey: ['content', sectionKey],
    queryFn: async () => (await api.get(`/content/${sectionKey}`)).data,
  });

  useEffect(() => {
    if (!data) return;
    setImageUrl(data.imageUrl || '');
    setMediaType(data.mediaType || 'image');
    setDarkImageUrl(data.darkImageUrl || '');
    setDarkMediaType(data.darkMediaType || 'image');
  }, [data]);

  const save = useMutation({
    mutationFn: (payload) => api.patch(`/content/admin/${sectionKey}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content', sectionKey] }),
  });

  async function onFile(e, target) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (target === 'dark') setUploadingDark(true);
    else setUploading(true);
    setMsg('');
    try {
      const meta = await uploadToCloudinary(file, cloudFolder, '/content/admin/cloudinary-signature');
      const url = meta.secure_url;
      const type = meta.resource_type === 'video' ? 'video' : 'image';
      if (target === 'dark') {
        setDarkImageUrl(url);
        setDarkMediaType(type);
      } else {
        setImageUrl(url);
        setMediaType(type);
      }
    } catch (err) {
      setMsg(err.message || 'Upload failed');
    } finally {
      if (target === 'dark') setUploadingDark(false);
      else setUploading(false);
      e.target.value = '';
    }
  }

  function resetForm() {
    setImageUrl(data?.imageUrl || '');
    setMediaType(data?.mediaType || 'image');
    setDarkImageUrl(data?.darkImageUrl || '');
    setDarkMediaType(data?.darkMediaType || 'image');
    setMsg('');
  }

  async function submit() {
    setMsg('');
    try {
      await save.mutateAsync({
        headline,
        body: data?.body || hint,
        imageUrl: imageUrl || null,
        mediaType: imageUrl ? mediaType : 'image',
        darkImageUrl: darkImageUrl || null,
        darkMediaType: darkImageUrl ? darkMediaType : 'image',
      });
      setMsg('Saved — refresh the storefront and toggle light/dark to preview.');
    } catch (e) {
      setMsg(e.response?.data?.message || 'Save failed');
    }
  }

  if (isLoading) {
    return <p className="admin-product-hint">Loading…</p>;
  }

  return (
    <div className="admin-shop-category-form-row">
      <section className="admin-product-card">
        <div className="admin-product-card-head">
          <span className="admin-product-card-head-icon">
            <ImageIcon size={16} />
          </span>
          <span className="min-w-0 flex-1">
            {title}
            <span className="admin-product-hint mt-0.5 block font-normal normal-case tracking-normal">{hint}</span>
          </span>
        </div>

        <div className="mt-5 grid gap-8 lg:grid-cols-2">
          <div>
            <p className="admin-field-label flex items-center gap-2">
              <Sun size={15} aria-hidden />
              Light mode background
            </p>
            {imageUrl ? (
              <div className="mt-3 w-full max-w-4xl">
                <AdminOfferTileCard
                  variant="band"
                  secureUrl={imageUrl}
                  resourceType={mediaType}
                  downloadName={`${sectionKey}-light`}
                  onRemove={() => {
                    setImageUrl('');
                    setMediaType('image');
                  }}
                />
              </div>
            ) : (
              <p className="admin-product-hint mt-3">No light-mode image — default styling is used.</p>
            )}
            <label className="admin-offer-upload-btn mt-4">
              <CloudUpload size={18} />
              {uploading ? 'Uploading…' : imageUrl ? 'Replace light image' : 'Upload light image'}
              <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => onFile(e, 'light')} />
            </label>
          </div>

          <div>
            <p className="admin-field-label flex items-center gap-2">
              <Moon size={15} aria-hidden />
              Dark mode background
            </p>
            {darkImageUrl ? (
              <div className="mt-3 w-full max-w-4xl">
                <AdminOfferTileCard
                  variant="band"
                  secureUrl={darkImageUrl}
                  resourceType={darkMediaType}
                  downloadName={`${sectionKey}-dark`}
                  onRemove={() => {
                    setDarkImageUrl('');
                    setDarkMediaType('image');
                  }}
                />
              </div>
            ) : (
              <p className="admin-product-hint mt-3">No dark image — uses the light background when dark theme is on.</p>
            )}
            <label className="admin-offer-upload-btn mt-4">
              <CloudUpload size={18} />
              {uploadingDark ? 'Uploading…' : darkImageUrl ? 'Replace dark image' : 'Upload dark image'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingDark}
                onChange={(e) => onFile(e, 'dark')}
              />
            </label>
          </div>
        </div>

        <div className="admin-product-actions mt-6">
          <button type="button" className="admin-btn-add" onClick={submit} disabled={save.isPending || uploading || uploadingDark}>
            <Check size={16} />
            {save.isPending ? 'Saving…' : saveLabel}
          </button>
          <button type="button" className="admin-btn-cancel" onClick={resetForm}>
            <X size={16} />
            Reset
          </button>
        </div>
        {msg && <p className="admin-product-hint mt-3 text-[#15803d]">{msg}</p>}
      </section>

      <aside className="admin-shop-category-guidelines">
        <h3 className="text-sm font-semibold text-stone-900">Image guidelines</h3>
        <ul className="admin-guidelines-list">
          {guidelineRows.map((row) => (
            <li key={row.label}>
              <span>{row.label}</span>
              <span>{row.value}</span>
            </li>
          ))}
        </ul>
        <p className="admin-product-hint mt-4">
          Preview on{' '}
          <a href={previewHref} target="_blank" rel="noreferrer" className="text-[#c97a35] underline underline-offset-2">
            {previewLabel}
          </a>
        </p>
        <div
          className="admin-guidelines-thumb"
          style={{ backgroundImage: 'url(/profile/QELMORA-admin.png)' }}
          aria-hidden
        />
      </aside>
    </div>
  );
}

export function FooterBackgroundEditor() {
  return (
    <SectionImageEditor
      sectionKey="site_footer"
      headline="Site footer background"
      title="Footer background"
      hint="Shown behind the site footer on every page. Remove the image and save to use the default look."
      guidelines={FOOTER_GUIDELINES}
      previewHref="/"
      previewLabel="homepage footer"
      cloudFolder="qelmora/footer"
      saveLabel="Save footer background"
    />
  );
}

export function NewsletterBackgroundEditor() {
  return (
    <SectionImageEditor
      sectionKey="newsletter_band"
      headline="Newsletter band background"
      title="Newsletter section (above footer)"
      hint="Background for the “Join the inner circle” band directly above the footer."
      guidelines={NEWSLETTER_GUIDELINES}
      previewHref="/"
      previewLabel="newsletter section"
      cloudFolder="qelmora/newsletter"
      saveLabel="Save newsletter background"
    />
  );
}

const BRAND_STORY_BAND_GUIDELINES = [
  { label: 'Size', value: '2400×900 px or wider (landscape)' },
  { label: 'Format', value: 'JPG, PNG, or WebP' },
  { label: 'File size', value: 'Under 800 KB' },
  { label: 'Tip', value: 'Cream / gold silk textures match the homepage brand story layout' },
  DARK_BAND_GUIDELINE,
];

const FEATURED_COLLECTION_GUIDELINES = [
  { label: 'Size', value: '2400×900 px or wider (landscape)' },
  { label: 'Format', value: 'JPG, PNG, or WebP' },
  { label: 'File size', value: 'Under 800 KB' },
  { label: 'Tip', value: 'Match cream/gold silk textures used for brand story and newsletter' },
  DARK_BAND_GUIDELINE,
];

const INSTAGRAM_BAND_GUIDELINES = [
  { label: 'Size', value: '2400×900 px or wider (landscape)' },
  { label: 'Format', value: 'JPG, PNG, or WebP' },
  { label: 'File size', value: 'Under 800 KB' },
  { label: 'Tip', value: 'Cream / gold wave textures match the Instagram mock; keep contrast for the marquee' },
  DARK_BAND_GUIDELINE,
];

const PROMO_BAND_GUIDELINES = [
  { label: 'Size', value: '2400×720 px wide (promo strip) or wider' },
  { label: 'Format', value: 'JPG, PNG, or WebP' },
  { label: 'File size', value: 'Under 800 KB' },
  { label: 'Tip', value: 'Optional silk/cream backdrop around the card; main product shot stays Admin → Banners → Promo' },
  DARK_BAND_GUIDELINE,
];

const SHOP_CATEGORY_BAND_GUIDELINES = [
  { label: 'Size', value: '2400×900 px or wider (landscape)' },
  { label: 'Format', value: 'JPG, PNG, or WebP' },
  { label: 'File size', value: 'Under 800 KB' },
  { label: 'Tip', value: 'Cream/gold textures; category tile images stay in Admin → Home shop by category' },
  DARK_BAND_GUIDELINE,
];

const NEW_ARRIVALS_BAND_GUIDELINES = [
  { label: 'Size', value: '2400×900 px or wider (landscape)' },
  { label: 'Format', value: 'JPG, PNG, or WebP' },
  { label: 'File size', value: 'Under 800 KB' },
  { label: 'Tip', value: 'Soft cream/silk backdrop; product cards are pulled automatically from new arrivals' },
  DARK_BAND_GUIDELINE,
];

const SHOP_OFFERS_BAND_GUIDELINES = [
  { label: 'Size', value: '2400×600 px or wider (wide strip behind carousel)' },
  { label: 'Format', value: 'JPG, PNG, or WebP' },
  { label: 'File size', value: 'Under 800 KB' },
  { label: 'Tip', value: 'Subtle textures — offer tile images stay in the carousel below' },
  DARK_BAND_GUIDELINE,
];

export function ShopMenOffersBandBackgroundEditor() {
  return (
    <SectionImageEditor
      sectionKey="shop_men_offers_band"
      headline="Men's shop offers band background"
      title="Offer carousel background (Men)"
      hint="Full-width strip behind the offer carousel on /shop/men. Upload tiles above in Men's Shop Offers."
      guidelines={SHOP_OFFERS_BAND_GUIDELINES}
      previewHref="/shop/men"
      previewLabel="men's shop offers"
      cloudFolder="qelmora/shop-offers-men"
      saveLabel="Save men's offers background"
    />
  );
}

export function ShopWomenOffersBandBackgroundEditor() {
  return (
    <SectionImageEditor
      sectionKey="shop_women_offers_band"
      headline="Women's shop offers band background"
      title="Offer carousel background (Women)"
      hint="Full-width strip behind the offer carousel on /shop/women. Upload tiles above in Women's Shop Offers."
      guidelines={SHOP_OFFERS_BAND_GUIDELINES}
      previewHref="/shop/women"
      previewLabel="women's shop offers"
      cloudFolder="qelmora/shop-offers-women"
      saveLabel="Save women's offers background"
    />
  );
}

const SHOP_SECTION_BAND_GUIDELINES = [
  { label: 'Size', value: '2400×900 px or wider (one section band)' },
  { label: 'Format', value: 'JPG, PNG, or WebP' },
  { label: 'File size', value: 'Under 800 KB' },
  { label: 'Tip', value: 'Each block on the shop page has its own background — not one image for the full page' },
  DARK_BAND_GUIDELINE,
];

const SHOP_MEN_SECTIONS = [
  {
    section: 'collection',
    title: 'Men — Shop the edit / Collection',
    hint: 'Only the collection block on /shop/men (and View all collection).',
    previewHref: '/shop/men#collection',
    previewLabel: 'men’s collection section',
    saveLabel: 'Save men’s collection background',
  },
  {
    section: 'new_arrivals',
    title: 'Men — Just landed / New arrivals',
    hint: 'Only the new arrivals block on /shop/men.',
    previewHref: '/shop/men#new-arrivals',
    previewLabel: 'men’s new arrivals section',
    saveLabel: 'Save men’s new arrivals background',
  },
  {
    section: 'trending',
    title: 'Men — Trending categories',
    hint: 'Only the trending carousel block on /shop/men. Tiles still from Admin → Trending categories.',
    previewHref: '/shop/men#trending-categories',
    previewLabel: 'men’s trending section',
    saveLabel: 'Save men’s trending background',
  },
  {
    section: 'best_sellers',
    title: 'Men — Best sellers',
    hint: 'Only the best sellers block on /shop/men.',
    previewHref: '/shop/men#best-sellers',
    previewLabel: 'men’s best sellers section',
    saveLabel: 'Save men’s best sellers background',
  },
];

const SHOP_WOMEN_SECTIONS = [
  {
    section: 'collection',
    title: 'Women — Shop the edit / Collection',
    hint: 'Only the collection block on /shop/women (and View all collection).',
    previewHref: '/shop/women#collection',
    previewLabel: 'women’s collection section',
    saveLabel: 'Save women’s collection background',
  },
  {
    section: 'new_arrivals',
    title: 'Women — Just landed / New arrivals',
    hint: 'Only the new arrivals block on /shop/women.',
    previewHref: '/shop/women#new-arrivals',
    previewLabel: 'women’s new arrivals section',
    saveLabel: 'Save women’s new arrivals background',
  },
  {
    section: 'trending',
    title: 'Women — Trending categories',
    hint: 'Only the trending carousel on /shop/women.',
    previewHref: '/shop/women#trending-categories',
    previewLabel: 'women’s trending section',
    saveLabel: 'Save women’s trending background',
  },
  {
    section: 'best_sellers',
    title: 'Women — Best sellers',
    hint: 'Only the best sellers block on /shop/women.',
    previewHref: '/shop/women#best-sellers',
    previewLabel: 'women’s best sellers section',
    saveLabel: 'Save women’s best sellers background',
  },
];

function ShopGenderSectionBackgroundEditors({ gender, sections }) {
  return (
    <div className="space-y-10">
      {sections.map((cfg) => (
        <SectionImageEditor
          key={cfg.section}
          sectionKey={`shop_${gender}_${cfg.section}_band`}
          headline={cfg.title}
          title={cfg.title}
          hint={cfg.hint}
          guidelines={SHOP_SECTION_BAND_GUIDELINES}
          previewHref={cfg.previewHref}
          previewLabel={cfg.previewLabel}
          cloudFolder={`qelmora/shop-${gender}-${cfg.section}`}
          saveLabel={cfg.saveLabel}
        />
      ))}
    </div>
  );
}

const NOWHERE_ELSE_BAND_GUIDELINES = [
  { label: 'Size', value: '2400×1200 px or wider' },
  { label: 'Format', value: 'JPG, PNG, or WebP' },
  { label: 'File size', value: 'Under 800 KB' },
  { label: 'Tip', value: 'Cream / gold silk works behind the headline; tiles stay separate in Nowhere Else' },
  DARK_BAND_GUIDELINE,
];

const STATIC_PAGE_BAND_GUIDELINES = [
  { label: 'Size', value: '2400×1200 px or wider' },
  { label: 'Format', value: 'JPG, PNG, or WebP' },
  { label: 'File size', value: 'Under 800 KB' },
  { label: 'Tip', value: 'Page backdrop only — inline story/form images stay in the editor cards below' },
  DARK_BAND_GUIDELINE,
];

const HEADER_BAND_GUIDELINES = [
  { label: 'Size', value: '2400×320 px or wider (wide strip — top nav height)' },
  { label: 'Format', value: 'JPG, PNG, or WebP' },
  { label: 'File size', value: 'Under 500 KB' },
  {
    label: 'Tip',
    value: 'Subtle texture or silk band; shows when sticky nav is visible (scroll on home, all inner pages). Hero overlay on home top stays clear.',
  },
  DARK_BAND_GUIDELINE,
];

const LOGIN_FORM_BAND_GUIDELINES = [
  { label: 'Size', value: '1600×1200 px or wider (form column)' },
  { label: 'Format', value: 'JPG, PNG, or WebP' },
  { label: 'File size', value: 'Under 800 KB' },
  { label: 'Tip', value: 'Subtle texture — left campaign panel stays in Login banner editor below' },
  DARK_BAND_GUIDELINE,
];

export function HeaderBandBackgroundEditor() {
  return (
    <SectionImageEditor
      sectionKey="site_header_band"
      headline="Site header background"
      title="Top navigation bar (storefront)"
      hint="Background behind the sticky header. On the homepage it appears after you scroll; at the very top the hero still shows through. Optional dark-theme image below."
      guidelines={HEADER_BAND_GUIDELINES}
      previewHref="/shop/men"
      previewLabel="storefront header (scroll or inner page)"
      cloudFolder="qelmora/site-header"
      saveLabel="Save header background"
    />
  );
}

export function LoginFormBandBackgroundEditor() {
  return (
    <SectionImageEditor
      sectionKey="login_form_band"
      headline="Login form area background"
      title="Sign-in form column (/login)"
      hint="Background behind the right-hand login and register forms. Left panel image stays in Login banner editor."
      guidelines={LOGIN_FORM_BAND_GUIDELINES}
      previewHref="/login"
      previewLabel="login page"
      cloudFolder="qelmora/login-form"
      saveLabel="Save login form background"
    />
  );
}

export function AboutBandBackgroundEditor() {
  return (
    <SectionImageEditor
      sectionKey="about_band"
      headline="About page background"
      title="About us (/about)"
      hint="Full-width background behind the about page. Portrait/story upload stays in About editor."
      guidelines={STATIC_PAGE_BAND_GUIDELINES}
      previewHref="/about"
      previewLabel="about page"
      cloudFolder="qelmora/about-band"
      saveLabel="Save about background"
    />
  );
}

export function ContactBandBackgroundEditor() {
  return (
    <SectionImageEditor
      sectionKey="contact_band"
      headline="Contact page background"
      title="Contact us (/contact)"
      hint="Full-width background behind the contact page. Side image stays in Contact editor."
      guidelines={STATIC_PAGE_BAND_GUIDELINES}
      previewHref="/contact"
      previewLabel="contact page"
      cloudFolder="qelmora/contact-band"
      saveLabel="Save contact background"
    />
  );
}

export function NowhereElseBandBackgroundEditor() {
  return (
    <SectionImageEditor
      sectionKey="nowhere_else_band"
      headline="Nowhere Else page background"
      title="Nowhere Else (/collections)"
      hint="Full-width background on the Nowhere Else page. Capsule tiles below are still managed separately."
      guidelines={NOWHERE_ELSE_BAND_GUIDELINES}
      previewHref="/collections"
      previewLabel="Nowhere Else page"
      cloudFolder="qelmora/nowhere-else"
      saveLabel="Save Nowhere Else background"
    />
  );
}

export function ShopMenSectionBackgroundEditors() {
  return <ShopGenderSectionBackgroundEditors gender="men" sections={SHOP_MEN_SECTIONS} />;
}

export function ShopWomenSectionBackgroundEditors() {
  return <ShopGenderSectionBackgroundEditors gender="women" sections={SHOP_WOMEN_SECTIONS} />;
}

export function HomeMenNewArrivalsBandBackgroundEditor() {
  return (
    <SectionImageEditor
      sectionKey="home_men_new_arrivals_band"
      headline="Homepage — men's new arrivals background"
      title="Just landed — Men's grid (homepage)"
      hint="Background behind the Men's new arrivals grid only. Women's grid has its own upload below. Products still from Admin → Products (new arrival)."
      guidelines={NEW_ARRIVALS_BAND_GUIDELINES}
      previewHref="/"
      previewLabel="homepage men's new arrivals"
      cloudFolder="qelmora/home-new-arrivals-men"
      saveLabel="Save men's homepage new arrivals background"
    />
  );
}

export function HomeWomenNewArrivalsBandBackgroundEditor() {
  return (
    <SectionImageEditor
      sectionKey="home_women_new_arrivals_band"
      headline="Homepage — women's new arrivals background"
      title="Just landed — Women's grid (homepage)"
      hint="Background behind the Women's new arrivals grid only. Men's grid has its own upload above."
      guidelines={NEW_ARRIVALS_BAND_GUIDELINES}
      previewHref="/"
      previewLabel="homepage women's new arrivals"
      cloudFolder="qelmora/home-new-arrivals-women"
      saveLabel="Save women's homepage new arrivals background"
    />
  );
}

export function ShopByCategoryBandBackgroundEditor() {
  return (
    <SectionImageEditor
      sectionKey="shop_by_category_band"
      headline="Shop by category band background"
      title="Shop by category (homepage)"
      hint="Background behind the Shop by category block. Men/Women (or custom) tiles still come from Admin → Home shop by category."
      guidelines={SHOP_CATEGORY_BAND_GUIDELINES}
      previewHref="/"
      previewLabel="homepage Shop by category"
      cloudFolder="qelmora/shop-by-category"
      saveLabel="Save shop by category background"
    />
  );
}

export function PromoBandBackgroundEditor() {
  return (
    <SectionImageEditor
      sectionKey="promo_band"
      headline="Limited offer promo band background"
      title="Limited offer / promo strip (homepage)"
      hint="Full-width band behind the limited offer block. The card photo and CTA link still come from Admin → Banners → Promo."
      guidelines={PROMO_BAND_GUIDELINES}
      previewHref="/"
      previewLabel="homepage promo strip"
      cloudFolder="qelmora/promo-band"
      saveLabel="Save promo band background"
    />
  );
}

export function FeaturedCollectionBandBackgroundEditor() {
  return (
    <SectionImageEditor
      sectionKey="featured_collection_band"
      headline="Featured collection band background"
      title="Featured collection (homepage)"
      hint="Background behind the featured collection block. Banner image/text still come from Admin → Banners (collection placement)."
      guidelines={FEATURED_COLLECTION_GUIDELINES}
      previewHref="/"
      previewLabel="homepage featured collection"
      cloudFolder="qelmora/featured"
      saveLabel="Save featured collection background"
    />
  );
}

export function InstagramBandBackgroundEditor() {
  return (
    <SectionImageEditor
      sectionKey="instagram_band"
      headline="Instagram band background"
      title="Instagram section (homepage)"
      hint="Background behind the Instagram feed marquee above the newsletter. Post images still come from Admin → Instagram."
      guidelines={INSTAGRAM_BAND_GUIDELINES}
      previewHref="/"
      previewLabel="homepage Instagram section"
      cloudFolder="qelmora/instagram"
      saveLabel="Save Instagram background"
    />
  );
}

export function BrandStoryBandBackgroundEditor() {
  return (
    <SectionImageEditor
      sectionKey="brand_story_band"
      headline="Brand story band background"
      title="Brand story section (homepage)"
      hint="Full-width background behind the homepage brand story block. Product image still comes from Admin → Brand story."
      guidelines={BRAND_STORY_BAND_GUIDELINES}
      previewHref="/"
      previewLabel="homepage brand story"
      cloudFolder="qelmora/brand-story"
      saveLabel="Save brand story background"
    />
  );
}

export function FooterAndNewsletterEditors() {
  return (
    <div className="space-y-12">
      <div className="admin-product-card-head mb-2">
        <span className="admin-product-card-head-icon">
          <Mail size={16} />
        </span>
        <span className="font-semibold text-stone-900">Homepage bands &amp; footer</span>
      </div>
      <HeaderBandBackgroundEditor />
      <HomeMenNewArrivalsBandBackgroundEditor />
      <HomeWomenNewArrivalsBandBackgroundEditor />
      <ShopByCategoryBandBackgroundEditor />
      <FeaturedCollectionBandBackgroundEditor />
      <PromoBandBackgroundEditor />
      <BrandStoryBandBackgroundEditor />
      <InstagramBandBackgroundEditor />
      <NewsletterBackgroundEditor />
      <FooterBackgroundEditor />
    </div>
  );
}