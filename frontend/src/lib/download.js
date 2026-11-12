/** Trigger a browser download for a Cloudinary (or any) asset URL. */
export async function downloadMedia(url, basename = 'qelmora-asset') {
  if (!url) return;
  const attachmentUrl = url.includes('/upload/')
    ? url.replace('/upload/', '/upload/fl_attachment/')
    : url;

  try {
    const res = await fetch(attachmentUrl);
    if (!res.ok) throw new Error('fetch failed');
    const blob = await res.blob();
    const ext = blob.type?.split('/')[1]?.split('+')[0] || 'jpg';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${basename}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  } catch {
    window.open(attachmentUrl, '_blank', 'noopener,noreferrer');
  }
}
