import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../api/client';

export function ContactForm({ formIntro, helpEmail, hideEmailLink = false }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [err, setErr] = useState('');

  const send = useMutation({
    mutationFn: () =>
      api.post('/contact', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        message: form.message.trim(),
      }),
    onSuccess: () => {
      setForm({ name: '', email: '', phone: '', message: '' });
      setErr('');
    },
    onError: (e) => setErr(e.response?.data?.message || 'Could not send. Try again.'),
  });

  function submit(e) {
    e.preventDefault();
    setErr('');
    if (!form.email.trim() || !form.message.trim()) return setErr('Email and message are required.');
    send.mutate();
  }

  const email = (helpEmail || 'hello@qelmora.com').replace(/^mailto:/i, '');
  const intro = hideEmailLink
    ? 'Tell us what you need — we typically reply within one business day.'
    : formIntro || 'Send a message';

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.35em] text-q-accent">Get in touch</p>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-stone-500">
        {hideEmailLink ? intro : `${intro} — or email ${email} directly.`}
      </p>
      {!hideEmailLink && (
        <p className="mt-2 text-xs text-stone-500">
          <a href={`mailto:${email}`} className="text-stone-600 underline-offset-2 hover:text-q-accent hover:underline">
            {email}
          </a>
        </p>
      )}

      <form onSubmit={submit} className={`space-y-4 ${hideEmailLink ? 'mt-8' : 'mt-6'}`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            className="contact-input"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            minLength={2}
          />
          <input
            type="email"
            className="contact-input"
            placeholder="Email *"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <input
          className="contact-input"
          placeholder="Phone number"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          inputMode="tel"
        />
        <textarea
          className="contact-input min-h-[140px] resize-y"
          placeholder="Comment"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          required
          minLength={3}
        />
        {err && <p className="text-sm text-red-500/90">{err}</p>}
        {send.isSuccess && <p className="text-sm text-q-accent">Message sent — we will reply soon.</p>}
        <button type="submit" disabled={send.isPending} className="contact-submit mt-2 w-full">
          {send.isPending ? 'Sending…' : 'Send message'}
        </button>
      </form>
    </div>
  );
}
