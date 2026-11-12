import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../api/client';

const emptyForm = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
};

export function AddressForm({ initialFullName = '', isDefault = true, onSuccess, onCancel, submitLabel = 'Save address' }) {
  const [form, setForm] = useState({ ...emptyForm, fullName: initialFullName });
  const [fieldError, setFieldError] = useState('');

  const save = useMutation({
    mutationFn: () =>
      api.post('/addresses', {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        line1: form.line1.trim(),
        line2: form.line2.trim() || null,
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim(),
        country: 'India',
        isDefault,
      }),
    onSuccess: ({ data }) => {
      setForm({ ...emptyForm, fullName: initialFullName });
      setFieldError('');
      onSuccess?.(data);
    },
    onError: (e) => {
      setFieldError(e.response?.data?.message || 'Could not save address');
    },
  });

  function submit(e) {
    e.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim() || !form.line1.trim() || !form.city.trim() || !form.state.trim() || !form.postalCode.trim()) {
      setFieldError('Fill all required fields.');
      return;
    }
    save.mutate();
  }

  const fields = [
    { key: 'fullName', label: 'Full name', required: true },
    { key: 'phone', label: 'Phone', required: true },
    { key: 'line1', label: 'Address line 1', required: true },
    { key: 'line2', label: 'Address line 2 (optional)', required: false },
    { key: 'city', label: 'City', required: true },
    { key: 'state', label: 'State', required: true },
    { key: 'postalCode', label: 'PIN code', required: true },
  ];

  return (
    <form onSubmit={submit} className="space-y-3">
      {fields.map(({ key, label, required }) => (
        <input
          key={key}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={label}
          required={required}
          className="input-field"
        />
      ))}
      {fieldError && <p className="text-sm text-red-400">{fieldError}</p>}
      {save.error?.response?.data?.errors && (
        <p className="text-xs text-red-400">Check your details and try again.</p>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        <button type="submit" disabled={save.isPending} className="btn-primary btn-accent flex-1 min-w-[8rem] disabled:opacity-50">
          {save.isPending ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-primary min-w-[6rem] border border-white/15 bg-transparent">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
