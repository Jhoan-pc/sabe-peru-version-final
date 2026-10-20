/**
 * Cloudinary URL Normalization Contract
 * Formal SSOT: specs/admin-spec.md §2 and PROJECT.md Interface Contract #1
 */

/**
 * Pure and deterministic function for Cloudinary URL normalization.
 * @param {string} url - Input image URL
 * @param {number} [width=800] - Target width transform
 * @returns {string} - Normalized Cloudinary URL or original url if not applicable
 */
export function normalizeCloudinaryUrl(url, width = 800) {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
    return url || '';
  }

  // Strip query parameters (?v=...)
  const cleanUrl = url.split('?')[0];

  // Locate the /upload/ anchor
  const uploadIndex = cleanUrl.indexOf('/upload/');
  if (uploadIndex === -1) return cleanUrl;

  const base = cleanUrl.substring(0, uploadIndex + 8);
  let rest = cleanUrl.substring(uploadIndex + 8);

  // If previous transformations exist, discard them to prevent nesting/duplication
  const parts = rest.split('/');
  if (parts.length > 1 && parts[0].includes('_')) {
    parts.shift(); // Remove old transformation segment
    rest = parts.join('/');
  }

  // Inject Quiet Luxury official standard transforms: f_auto,q_auto,w_{width},c_limit
  return `${base}f_auto,q_auto,w_${width},c_limit/${rest}`;
}
