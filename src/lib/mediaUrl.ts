/**
 * Convert a Supabase Storage public URL into the on-the-fly image
 * transformation endpoint (requires Supabase Pro). Returns WebP, resized
 * and re-compressed at the edge — typically 3-5x smaller than the original.
 */
export function optimizeImage(url: string, width = 900, quality = 75): string {
  if (!url) return url;
  if (!url.includes("/storage/v1/object/public/")) return url;
  return (
    url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/") +
    `?width=${width}&quality=${quality}`
  );
}
