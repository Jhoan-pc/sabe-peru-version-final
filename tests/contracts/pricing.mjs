/**
 * Dual Pricing Domain Contract
 * Formal SSOT: specs/SDD_MASTER.md §3.2 (4), PROJECT.md Interface Contract & Feature #13
 */

/**
 * Formats a menu item's price following the Quiet Luxury dual pricing invariant:
 * - price > 0: "XX.XX€" with class "menu-item-price"
 * - price == 0: delegate description as market price indicator with class "menu-item-price dual"
 * @param {number|string} price
 * @param {string} [description=""]
 * @returns {{ isMarketPrice: boolean, priceClass: string, displayPrice: string }}
 */
export function formatMenuItemPrice(price, description = '') {
  const numericPrice = typeof price === 'number' ? price : parseFloat(price);

  if (isNaN(numericPrice) || numericPrice <= 0) {
    return {
      isMarketPrice: true,
      priceClass: 'menu-item-price dual',
      displayPrice: (description && description.trim().length > 0)
        ? description.trim()
        : 'Precio según mercado'
    };
  }

  return {
    isMarketPrice: false,
    priceClass: 'menu-item-price',
    displayPrice: `${numericPrice.toFixed(2)}€`
  };
}
