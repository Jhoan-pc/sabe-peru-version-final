/**
 * AllergenTag Contract & Schema Invariants
 * Formal SSOT: specs/openapi.yaml lines 423-441, specs/SDD_MASTER.md, PROJECT.md Interface Contract #2
 */

export const OFFICIAL_ALLERGEN_TAGS = Object.freeze([
  'pescado',
  'marisco',
  'carne',
  'pollo',
  'picante',
  'gluten-free',
  'gluten',
  'huevos',
  'lacteos',
  'soja',
  'cacahuetes',
  'mostaza',
  'crustaceos',
  'apio',
  'moluscos',
  'sesamo'
]);

export const ALLERGEN_LABELS = Object.freeze({
  'pescado': 'PESCADO',
  'marisco': 'MARISCO',
  'carne': 'CARNE',
  'pollo': 'POLLO',
  'picante': 'PICANTE',
  'gluten-free': 'SIN GLUTEN',
  'gluten': 'CON GLUTEN',
  'huevos': 'HUEVOS',
  'lacteos': 'LÁCTEOS',
  'soja': 'SOJA',
  'cacahuetes': 'CACAHUETES',
  'mostaza': 'MOSTAZA',
  'crustaceos': 'CRUSTÁCEOS',
  'apio': 'APIO',
  'moluscos': 'MOLUSCOS',
  'sesamo': 'SÉSAMO'
});

/**
 * Validates if a single string is a valid AllergenTag enum value.
 * @param {string} tag
 * @returns {boolean}
 */
export function isValidAllergenTag(tag) {
  return typeof tag === 'string' && OFFICIAL_ALLERGEN_TAGS.includes(tag);
}

/**
 * Validates and sanitizes a list of allergen tags for a menu item.
 * @param {string[]} tags
 * @returns {{ valid: boolean, sanitized: string[], errors: string[] }}
 */
export function validateDishAllergenTags(tags) {
  if (!Array.isArray(tags)) {
    return { valid: false, sanitized: [], errors: ['Tags must be an array'] };
  }

  const errors = [];
  const uniqueSet = new Set();

  for (const tag of tags) {
    if (!isValidAllergenTag(tag)) {
      errors.push(`Invalid allergen tag: "${tag}"`);
    } else {
      uniqueSet.add(tag);
    }
  }

  return {
    valid: errors.length === 0,
    sanitized: Array.from(uniqueSet),
    errors
  };
}

/**
 * Formats an allergen tag as an accessible Quiet Luxury pill.
 * @param {string} tag
 * @returns {string} HTML markup
 */
export function renderAllergenPill(tag) {
  if (!isValidAllergenTag(tag)) return '';
  const label = (tag === 'gluten-free' ? 'GLUTEN-FREE' : tag).toUpperCase();
  return `<span class="allergen-pill" data-allergen="${tag}">${label}</span>`;
}
