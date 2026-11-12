import { api } from '../api/client';

export async function uploadToCloudinary(file, folder = 'qelmora/products', signaturePath = '/products/admin/cloudinary-signature') {
  let sig;
  try {
    const { data } = await api.post(signaturePath, { folder });
    sig = data;
  } catch (e) {
    const msg = e.response?.data?.message;
    if (e.response?.status === 401 || e.response?.status === 403) {
      throw new Error(msg || 'Admin login required for uploads.');
    }
    throw new Error(msg || 'Could not get Cloudinary signature from API.');
  }

  const cloudName = sig?.cloudName || sig?.cloud_name;
  const apiKey = sig?.apiKey || sig?.api_key;
  if (!cloudName || !apiKey || !sig?.signature) {
    throw new Error(
      'Cloudinary cloud name missing from API. Set CLOUDINARY_CLOUD_NAME in backend/.env and restart the backend (npm run dev).'
    );
  }

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('signature', sig.signature);
  form.append('folder', sig.folder || folder);
  const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
  const res = await fetch(endpoint, { method: 'POST', body: form });
  const json = await res.json();
  if (!res.ok) {
    const detail = json.error?.message || 'Upload failed';
    if (detail.includes('cloud_name is disabled')) {
      throw new Error(
        'Cloudinary account not active or cloud name wrong. Verify email on Cloudinary dashboard and check CLOUDINARY_CLOUD_NAME in backend/.env, then restart the API.'
      );
    }
    throw new Error(detail);
  }
  return {
    secure_url: json.secure_url,
    public_id: json.public_id,
    resource_type: resourceType,
  };
}
