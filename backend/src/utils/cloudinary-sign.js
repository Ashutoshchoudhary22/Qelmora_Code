import cloudinary from '../config/cloudinary.js';

function trimEnv(name) {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

export function getCloudinaryConfig() {
  return {
    cloudName: trimEnv('CLOUDINARY_CLOUD_NAME'),
    apiKey: trimEnv('CLOUDINARY_API_KEY'),
    apiSecret: trimEnv('CLOUDINARY_API_SECRET'),
  };
}

export function cloudinaryConfigured() {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  return Boolean(cloudName && apiKey && apiSecret);
}

/** @returns {null | { status: number, body: object }} */
export function cloudinaryConfigErrorResponse() {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const missing = [];
  if (!cloudName) missing.push('CLOUDINARY_CLOUD_NAME');
  if (!apiKey) missing.push('CLOUDINARY_API_KEY');
  if (!apiSecret) missing.push('CLOUDINARY_API_SECRET');
  if (!missing.length) return null;
  return {
    status: 503,
    body: {
      message: `Cloudinary not configured (${missing.join(', ')}). Set values in backend/.env and restart the API server.`,
    },
  };
}

export function createUploadSignature(folder) {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, apiSecret);
  return {
    timestamp,
    folder,
    signature,
    cloudName,
    apiKey,
  };
}
