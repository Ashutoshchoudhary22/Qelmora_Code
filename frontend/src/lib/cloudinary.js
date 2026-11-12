import { api } from '../api/client';

export async function uploadToCloudinary(file, folder = 'qelmora/products', signaturePath = '/products/admin/cloudinary-signature') {
  const { data: sig } = await api.post(signaturePath, { folder });
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('signature', sig.signature);
  form.append('folder', sig.folder);
  const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
  const endpoint = `https://api.cloudinary.com/v1_1/${sig.cloudName}/${resourceType}/upload`;
  const res = await fetch(endpoint, { method: 'POST', body: form });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'Upload failed');
  return {
    secure_url: json.secure_url,
    public_id: json.public_id,
    resource_type: resourceType,
  };
}
