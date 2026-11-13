import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../api/client';

export function ContactForm({ formIntro, helpEmail }) {
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

  const intro = formIntro || 'Fill the form or email us on';
  const email = helpEmail || 'hello@qelmora.com';

  return (
    <div className="contact-panel">
      <p className="text-[11px] uppercase tracking-[0.12em] text-stone-600">
        {intro}{' '}
        <a href={`mailto:${email}`} className="font-medium text-stone-800 underline-offset-2 hover:underline">
          {email}
        </a>
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
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
        {err && <p className="text-sm text-red-600">{err}</p>}
        {send.isSuccess && <p className="text-sm text-stone-600">Message sent. We will reply soon.</p>}
        <button type="submit" disabled={send.isPending} className="contact-submit w-full sm:w-auto">
          {send.isPending ? 'Sending…' : 'Send message'}
        </button>
      </form>
    </div>
  );
}
