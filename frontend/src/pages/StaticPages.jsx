export function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-20 md:px-8">
      <p className="text-[10px] uppercase tracking-[0.4em] text-q-accent">About us</p>
      <h1 className="font-display mt-4 text-5xl font-light">The QELMORA edit</h1>
      <p className="mt-8 text-sm leading-8 text-stone-400">
        Founded on the belief that luxury is restraint, QELMORA designs modular wardrobes for people who travel light and
        dress with intent. We partner with mills in Gujarat and Tamil Nadu, finish in small batches, and release only what
        we would wear ourselves.
      </p>
    </main>
  );
}

export function ContactPage() {
  return (
    <main className="mx-auto max-w-xl px-5 py-20 md:px-8">
      <p className="text-[10px] uppercase tracking-[0.4em] text-q-accent">Contact</p>
      <h1 className="font-display mt-4 text-5xl font-light">Client care</h1>
      <p className="mt-6 text-sm text-stone-400">hello@qelmora.com · Mon–Sat, 10am–7pm IST</p>
      <p className="mt-4 text-sm text-stone-500">Bandra Kurla Complex, Mumbai, India</p>
    </main>
  );
}

export function CollectionsPage() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-20 md:px-8">
      <h1 className="font-display text-5xl font-light">Collections</h1>
      <p className="mt-4 max-w-lg text-sm text-stone-500">
        Seasonal capsules and permanent icons. Browse by category or explore new arrivals.
      </p>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {[
          { to: '/shop/men', title: 'Men' },
          { to: '/shop/women', title: 'Women' },
          { to: '/shop/new-arrivals', title: 'New Arrivals' },
        ].map((c) => (
          <a key={c.to} href={c.to} className="flex min-h-[200px] items-end border border-white/10 p-6 transition hover:border-q-accent/50">
            <span className="font-display text-3xl">{c.title}</span>
          </a>
        ))}
      </div>
    </main>
  );
}
