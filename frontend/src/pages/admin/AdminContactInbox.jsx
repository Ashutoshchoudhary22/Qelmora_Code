import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Link } from 'react-router-dom';

export default function AdminContactInbox() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-contact-messages'],
    queryFn: async () => (await api.get('/contact/admin')).data,
  });

  const items = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-light">Contact inbox</h1>
          <p className="mt-2 text-sm text-stone-500">Messages from the /contact form.</p>
        </div>
        <Link to="/admin/static-pages" className="text-[10px] uppercase tracking-widest text-q-accent hover:underline">
          Edit contact page →
        </Link>
      </div>

      {isLoading ? (
        <p className="text-stone-500">Loading…</p>
      ) : !items.length ? (
        <p className="text-sm text-stone-600">No messages yet.</p>
      ) : (
        <ul className="divide-y divide-white/10">
          {items.map((m) => (
            <li key={m.id} className="py-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium text-stone-100">{m.name}</p>
                <p className="text-[10px] uppercase tracking-widest text-stone-600">
                  {new Date(m.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
              <p className="mt-1 text-sm text-stone-500">
                <a href={`mailto:${m.email}`} className="text-q-accent hover:underline">
                  {m.email}
                </a>
                {m.phone ? ` · ${m.phone}` : ''}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-400">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
