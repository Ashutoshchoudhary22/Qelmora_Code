import { useState } from 'react';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  function submit(e) {
    e.preventDefault();
    if (!email.includes('@')) return;
    setDone(true);
  }

  return (
    <section className="border-y border-white/10 bg-[linear-gradient(180deg,#111_0%,#090909_100%)]">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-q-accent">Private list</p>
          <h2 className="font-display mt-4 text-4xl font-light text-stone-100">Join the inner circle</h2>
          <p className="mt-4 text-sm leading-7 text-stone-500">
            First access to drops, archive sales, and stories from the atelier.
          </p>
          {done ? (
            <p className="mt-8 text-sm tracking-wide text-stone-300">You&apos;re on the list. Welcome in.</p>
          ) : (
            <form onSubmit={submit} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="input-field flex-1"
              />
              <button type="submit" className="btn-primary btn-accent sm:shrink-0">
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
