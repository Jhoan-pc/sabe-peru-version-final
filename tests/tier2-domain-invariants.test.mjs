/**
 * Tier 2: Boundary & Domain Invariants Test Suite
 * Formal SSOT: specs/admin-spec.md §2, specs/SDD_MASTER.md §3.2, specs/openapi.yaml, PROJECT.md Interface Contracts #1, #2, #3
 * 
 * Verifies pure function contracts, domain boundaries, pricing dualities,
 * and OpenAPI schema enumerations.
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCloudinaryUrl } from './contracts/cloudinary.mjs';
import {
  OFFICIAL_ALLERGEN_TAGS,
  isValidAllergenTag,
  validateDishAllergenTags,
  renderAllergenPill
} from './contracts/allergens.mjs';
import {
  KITCHEN_HOURS,
  generateDaySlots,
  checkSlotAvailability,
  validateGuestCount,
  generateReservationLocator,
  MAX_ACTIVE_RESERVATIONS_PER_SLOT,
  LOCATOR_REGEX
} from './contracts/reservations.mjs';
import { formatMenuItemPrice } from './contracts/pricing.mjs';
import { loadOpenApiSpec } from './helpers/openapi-parser.mjs';

describe('Tier 2: Boundary & Domain Invariants', () => {

  describe('Feature 2.1: normalizeCloudinaryUrl Pure Contract', () => {
    test('T2.1.1: Standard Cloudinary URL receives f_auto,q_auto,w_800,c_limit standard transformation', () => {
      const input = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
      const expected = 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800,c_limit/sample.jpg';
      assert.equal(normalizeCloudinaryUrl(input), expected);
    });

    test('T2.1.2: Query strings like ?v=123 are stripped clean to prevent cache busting corruption', () => {
      const withVersionPath = 'https://res.cloudinary.com/dhvbqs2ba/image/upload/v1720000000/ceviche.jpg?v=2';
      const expectedWithVersion = 'https://res.cloudinary.com/dhvbqs2ba/image/upload/f_auto,q_auto,w_800,c_limit/v1720000000/ceviche.jpg';
      assert.equal(normalizeCloudinaryUrl(withVersionPath), expectedWithVersion);

      const simpleUrlWithQuery = 'https://res.cloudinary.com/dhvbqs2ba/image/upload/ceviche.jpg?v=999';
      const expectedSimple = 'https://res.cloudinary.com/dhvbqs2ba/image/upload/f_auto,q_auto,w_800,c_limit/ceviche.jpg';
      assert.equal(normalizeCloudinaryUrl(simpleUrlWithQuery), expectedSimple);
    });

    test('T2.1.3: Prevents nested/duplicate transformations if existing transforms are present', () => {
      const alreadyTransformed = 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/sample.jpg';
      const expected = 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800,c_limit/sample.jpg';
      assert.equal(normalizeCloudinaryUrl(alreadyTransformed), expected);

      // Re-normalizing an already normalized URL must be idempotent
      assert.equal(normalizeCloudinaryUrl(expected), expected);
    });

    test('T2.1.4: Respects custom width parameter (e.g. w_400, w_1200, w_1600)', () => {
      const input = 'https://res.cloudinary.com/demo/image/upload/hero.jpg';
      assert.equal(
        normalizeCloudinaryUrl(input, 400),
        'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_400,c_limit/hero.jpg'
      );
      assert.equal(
        normalizeCloudinaryUrl(input, 1600),
        'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_1600,c_limit/hero.jpg'
      );
    });

    test('T2.1.5: Edge cases return input unchanged (null, undefined, non-Cloudinary, missing /upload/)', () => {
      assert.equal(normalizeCloudinaryUrl(''), '');
      assert.equal(normalizeCloudinaryUrl(null), '');
      assert.equal(normalizeCloudinaryUrl(undefined), '');
      const externalUrl = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c';
      assert.equal(normalizeCloudinaryUrl(externalUrl), externalUrl);
      const invalidCloudinary = 'https://res.cloudinary.com/demo/raw/file.pdf';
      assert.equal(normalizeCloudinaryUrl(invalidCloudinary), invalidCloudinary);
    });

    test('T2.1.6: Adversarial edge cases (complex queries, multi-segment paths, encoded chars)', () => {
      const complex = 'https://res.cloudinary.com/demo/image/upload/folder/subfolder/platillo%20especial.png?param1=foo&v=99';
      const expected = 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800,c_limit/folder/subfolder/platillo%20especial.png';
      assert.equal(normalizeCloudinaryUrl(complex), expected);
    });
  });

  describe('Feature 2.2: Slot Capacity Limits (Max 4 per 30m Slot)', () => {
    test('T2.2.1: Slot with 0 active bookings reports available: true', () => {
      const res = checkSlotAvailability(0);
      assert.equal(res.available, true);
      assert.equal(res.reason, undefined);
    });

    test('T2.2.2: Boundary: Slot with 3 active bookings reports available: true', () => {
      const res = checkSlotAvailability(3);
      assert.equal(res.available, true);
      assert.equal(res.reason, undefined);
    });

    test('T2.2.3: Boundary: Slot with exactly 4 active bookings reports available: false with reason Completo', () => {
      const res = checkSlotAvailability(4);
      assert.equal(res.available, false);
      assert.equal(res.reason, 'Completo');
    });

    test('T2.2.4: Slot with more than 4 bookings (overflow) reports available: false', () => {
      const res = checkSlotAvailability(5);
      assert.equal(res.available, false);
      assert.equal(res.reason, 'Completo');
    });

    test('T2.2.5: Cancelled reservations are strictly excluded from capacity calculations', () => {
      const bookings = [
        { status: 'confirmed' },
        { status: 'pending' },
        { status: 'confirmed' },
        { status: 'cancelled' },
        { status: 'cancelled' }
      ];
      const activeCount = bookings.filter(b => b.status !== 'cancelled').length;
      assert.equal(activeCount, 3);
      assert.equal(checkSlotAvailability(activeCount).available, true);
    });

    test('T2.2.6: Slot generation adheres to KITCHEN_HOURS 30m intervals for each day of the week', () => {
      // Sunday (0): 12:00 to 21:30
      const sunSlots = generateDaySlots(0);
      assert.equal(sunSlots[0], '12:00');
      assert.equal(sunSlots[sunSlots.length - 1], '21:30');
      assert.ok(sunSlots.includes('14:30'));
      assert.ok(!sunSlots.includes('22:00'));

      // Weekday Monday (1): 12:00 to 23:30
      const monSlots = generateDaySlots(1);
      assert.equal(monSlots[0], '12:00');
      assert.equal(monSlots[monSlots.length - 1], '23:30');

      // Saturday (6): 12:00 to 22:30
      const satSlots = generateDaySlots(6);
      assert.equal(satSlots[0], '12:00');
      assert.equal(satSlots[satSlots.length - 1], '22:30');
    });
  });

  describe('Feature 2.3: Dual Pricing Formatting', () => {
    test('T2.3.1: Standard positive price formats with two decimal places and € symbol', () => {
      const res = formatMenuItemPrice(24.5);
      assert.equal(res.isMarketPrice, false);
      assert.equal(res.priceClass, 'menu-item-price');
      assert.equal(res.displayPrice, '24.50€');

      const res2 = formatMenuItemPrice(18);
      assert.equal(res2.displayPrice, '18.00€');
    });

    test('T2.3.2: Price of 0 delegates to description as market price indicator', () => {
      const res = formatMenuItemPrice(0, 'Precio según mercado');
      assert.equal(res.isMarketPrice, true);
      assert.equal(res.priceClass, 'menu-item-price dual');
      assert.equal(res.displayPrice, 'Precio según mercado');
    });

    test('T2.3.3: Price of 0 with custom description delegates custom market text', () => {
      const res = formatMenuItemPrice(0, 'Consulte al maître por disponibilidad');
      assert.equal(res.isMarketPrice, true);
      assert.equal(res.displayPrice, 'Consulte al maître por disponibilidad');
    });

    test('T2.3.4: Boundary values: 0.00 is market price, 0.01 is numeric price', () => {
      const zero = formatMenuItemPrice(0.00);
      assert.equal(zero.isMarketPrice, true);

      const oneCent = formatMenuItemPrice(0.01);
      assert.equal(oneCent.isMarketPrice, false);
      assert.equal(oneCent.displayPrice, '0.01€');
    });

    test('T2.3.5: Formatting handles numeric strings and invalid inputs with fallback', () => {
      const strPrice = formatMenuItemPrice('32.50');
      assert.equal(strPrice.isMarketPrice, false);
      assert.equal(strPrice.displayPrice, '32.50€');

      const nanPrice = formatMenuItemPrice('invalid');
      assert.equal(nanPrice.isMarketPrice, true);
      assert.equal(nanPrice.displayPrice, 'Precio según mercado');
    });
  });

  describe('Feature 2.4: 16 AllergenTag Enum Verification', () => {
    test('T2.4.1: AllergenTag enum contains exactly the 16 canonical items in openapi.yaml', () => {
      const openapi = loadOpenApiSpec();
      const specAllergens = openapi.extractAllergenEnum();
      assert.equal(specAllergens.length, 16, 'OpenAPI spec must declare exactly 16 allergen enum values');
      assert.deepEqual(specAllergens.sort(), [...OFFICIAL_ALLERGEN_TAGS].sort());
    });

    test('T2.4.2: Validates all 16 official allergen tags', () => {
      for (const tag of OFFICIAL_ALLERGEN_TAGS) {
        assert.equal(isValidAllergenTag(tag), true, `Tag ${tag} must be recognized as valid`);
      }
    });

    test('T2.4.3: Strictly rejects unknown or unstandardized allergen tags', () => {
      const invalidTags = ['nuez', 'vegano', 'cerdo', 'alcohol', 'lupin', '', null, undefined, 123];
      for (const tag of invalidTags) {
        assert.equal(isValidAllergenTag(tag), false, `Tag ${tag} must be rejected`);
      }
    });

    test('T2.4.4: validateDishAllergenTags enforces uniqueness and reports invalid tags', () => {
      const mixed = ['pescado', 'marisco', 'pescado', 'invalid-tag'];
      const result = validateDishAllergenTags(mixed);
      assert.equal(result.valid, false);
      assert.deepEqual(result.sanitized, ['pescado', 'marisco']);
      assert.equal(result.errors.length, 1);
    });

    test('T2.4.5: Allergen pill markup outputs uppercase text and semantic class allergen-pill', () => {
      const pill = renderAllergenPill('pescado');
      assert.equal(pill, '<span class="allergen-pill" data-allergen="pescado">PESCADO</span>');

      const glutenFreePill = renderAllergenPill('gluten-free');
      assert.equal(glutenFreePill, '<span class="allergen-pill" data-allergen="gluten-free">GLUTEN-FREE</span>');

      const invalidPill = renderAllergenPill('invalid');
      assert.equal(invalidPill, '');
    });
  });
});
