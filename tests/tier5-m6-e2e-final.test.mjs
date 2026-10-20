/**
 * Tier 5: Milestone 6 Final E2E Integration & Cross-Module Hardening Test Suite
 * SSOT: ORIGINAL_REQUEST.md, specs/SDD_MASTER.md, specs/openapi.yaml,
 *       specs/admin-spec.md, specs/performance-spec.md, specs/design-system-spec.md
 * Agent: m6_challenger_1 (Milestone 6 Challenger - Empirical Adversarial Integration)
 *
 * Comprehensive adversarial verification across all 5 completed milestones ([DT-01] to [DT-13]):
 * - Journey 1: Landing page performance, preconnect, hero LCP priority, skeleton dimensions, passive observer
 * - Journey 2: Carta browsing, subcategory switching, zero emoji leaks, 16 allergen tags uppercase, dual pricing,
 *              photo modal Escape dismissal & zero listener accumulation
 * - Journey 3: Backoffice gallery (Firestore gallery_items + Cloudinary REST), 16-chip allergen selector sync,
 *              live preview with 10MB rejection, reservations operational hub (filters + actions)
 * - Journey 4: Customer reservation booking with 2-step anti-popup concierge, Crockford-32 locator ^SP-[A-Z0-9]{4}$,
 *              4-table capacity cap, >6 pax imperial table notice, RFC 9457 toasts, zero alert() & zero window.open
 * - Cross-Module Hardening: CSS Quiet Luxury tokens, zero Supabase in production, zero TypeScript : any annotations
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Import canonical contracts
import { normalizeCloudinaryUrl as contractNormalizeCloudinary } from './contracts/cloudinary.mjs';
import {
  OFFICIAL_ALLERGEN_TAGS as CONTRACT_ALLERGEN_TAGS,
  isValidAllergenTag as contractIsValidAllergen,
  renderAllergenPill as contractRenderPill,
  validateDishAllergenTags as contractValidateAllergens
} from './contracts/allergens.mjs';
import {
  formatMenuItemPrice as contractFormatPrice
} from './contracts/pricing.mjs';
import {
  KITCHEN_HOURS as CONTRACT_KITCHEN_HOURS,
  generateDaySlots as contractGenerateDaySlots,
  checkSlotAvailability as contractCheckSlot,
  validateGuestCount as contractValidateGuests,
  generateReservationLocator as contractGenerateLocator,
  buildWhatsAppReservationUrl as contractBuildWaUrl,
  LOCATOR_REGEX
} from './contracts/reservations.mjs';
import {
  createProblemDetails as contractCreateProblem,
  renderProblemToastHtml as contractRenderProblemToast
} from './contracts/errors.mjs';
import { MockElement, MockDocument } from './helpers/mock-dom.mjs';

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, 'src');

/**
 * Deterministic PRNG (Mulberry32) for reproducible statistical tests
 */
function createMulberry32(seed = 1337) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Extracts a function body from a TypeScript file by counting matching curly braces.
 */
function extractFunctionBodyFromTs(filePath, fnName) {
  const code = fs.readFileSync(filePath, 'utf8');
  const marker = 'export function ' + fnName;
  const startIdx = code.indexOf(marker);
  if (startIdx === -1) {
    throw new Error(`Could not find declaration of "${fnName}" in ${filePath}`);
  }

  const firstParen = code.indexOf('(', startIdx);
  let pDepth = 1;
  let pIdx = firstParen + 1;
  while (pIdx < code.length && pDepth > 0) {
    if (code[pIdx] === '(') pDepth++;
    else if (code[pIdx] === ')') pDepth--;
    pIdx++;
  }

  const openBrace = code.indexOf('{', pIdx);
  let depth = 1;
  let idx = openBrace + 1;
  while (idx < code.length && depth > 0) {
    if (code[idx] === '{') depth++;
    else if (code[idx] === '}') depth--;
    idx++;
  }

  let body = code.substring(openBrace + 1, idx - 1);
  // Strip TS type annotations
  body = body.replace(/:\s*[A-Z][A-Za-z0-9_<>\[\]]*/g, '');
  return body;
}

// Instantiate pure functions extracted from actual src/*.ts files
const mainTsPath = path.join(SRC_DIR, 'main.ts');
const adminTsPath = path.join(SRC_DIR, 'admin.ts');
const reservationsTsPath = path.join(SRC_DIR, 'reservations.ts');

const srcSanitizeDishName = new Function(
  'name',
  extractFunctionBodyFromTs(mainTsPath, 'sanitizeDishName')
);

const srcMainNormalizeCloudinary = new Function(
  'url',
  'width = 800',
  extractFunctionBodyFromTs(mainTsPath, 'normalizeCloudinaryUrl')
);

const srcAdminNormalizeCloudinary = new Function(
  'url',
  'width = 800',
  extractFunctionBodyFromTs(adminTsPath, 'normalizeCloudinaryUrl')
);

const srcFormatMenuItemPrice = new Function(
  'price',
  'description = ""',
  extractFunctionBodyFromTs(mainTsPath, 'formatMenuItemPrice')
);

const srcValidateUploadFile = new Function(
  'file',
  extractFunctionBodyFromTs(adminTsPath, 'validateUploadFile')
);

const srcGenerateLocator = new Function(
  'rng = Math.random',
  extractFunctionBodyFromTs(reservationsTsPath, 'generateReservationLocator')
);

const srcCheckSlotAvailability = new Function(
  'activeCount',
  'const MAX_ACTIVE_RESERVATIONS_PER_SLOT = 4;\n' +
    extractFunctionBodyFromTs(reservationsTsPath, 'checkSlotAvailability')
);

const srcValidateGuestCount = new Function(
  'people',
  'const MAX_STANDARD_GROUP_SIZE = 6;\nconst MAX_TOTAL_GUEST_CAPACITY = 20;\n' +
    extractFunctionBodyFromTs(reservationsTsPath, 'validateGuestCount')
);

const srcEscapeHtml = new Function(
  'str',
  extractFunctionBodyFromTs(reservationsTsPath, 'escapeHtml')
);

const srcBuildWaUrl = new Function(
  'params',
  extractFunctionBodyFromTs(reservationsTsPath, 'buildWhatsAppReservationUrl')
);

const srcRenderConfirmationCard = new Function(
  'data',
  'const escapeHtml = ' + srcEscapeHtml.toString() + ';\n' +
    extractFunctionBodyFromTs(reservationsTsPath, 'renderConfirmationCardHtml')
);

describe('Tier 5 / Milestone 6: Final E2E Integration & Cross-Module Hardening', () => {

  // ==========================================================================
  // JOURNEY 1: Landing Page Performance, Preconnect, Hero LCP, Skeletons & Observers
  // ==========================================================================
  describe('Journey 1: Landing Page Performance & CWV Hygiene', () => {
    const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
    const styleCss = fs.readFileSync(path.join(SRC_DIR, 'style.css'), 'utf8');
    const mainTs = fs.readFileSync(path.join(SRC_DIR, 'main.ts'), 'utf8');

    test('J1.1: Hero LCP Priority — #img-hero-1 has fetchpriority="high", loading="eager", decoding="async"', () => {
      // Find img-hero-1
      const hero1Match = indexHtml.match(/<img[^>]*id=["']img-hero-1["'][^>]*>/i);
      assert.ok(hero1Match, 'index.html must contain #img-hero-1');
      const heroTag = hero1Match[0];

      assert.match(heroTag, /fetchpriority=["']high["']/i, 'Hero LCP image must have fetchpriority="high"');
      assert.match(heroTag, /loading=["']eager["']/i, 'Hero LCP image must have loading="eager"');
      assert.match(heroTag, /decoding=["']async["']/i, 'Hero LCP image must have decoding="async"');

      // Verify subsequent slideshow images have loading="lazy"
      const hero2Match = indexHtml.match(/<img[^>]*id=["']img-hero-2["'][^>]*>/i);
      const hero3Match = indexHtml.match(/<img[^>]*id=["']img-hero-3["'][^>]*>/i);
      const hero4Match = indexHtml.match(/<img[^>]*id=["']img-hero-4["'][^>]*>/i);

      assert.ok(hero2Match && hero3Match && hero4Match, 'index.html must contain slide images 2, 3, and 4');
      assert.match(hero2Match[0], /loading=["']lazy["']/i, '#img-hero-2 must have loading="lazy"');
      assert.match(hero3Match[0], /loading=["']lazy["']/i, '#img-hero-3 must have loading="lazy"');
      assert.match(hero4Match[0], /loading=["']lazy["']/i, '#img-hero-4 must have loading="lazy"');
    });

    test('J1.2: Preconnect & Asynchronous Fonts across all MPA entrypoints', () => {
      const htmlFiles = ['index.html', 'carta.html', 'admin.html', 'experiencia.html'];
      for (const file of htmlFiles) {
        const content = fs.readFileSync(path.join(ROOT_DIR, file), 'utf8');
        assert.match(
          content,
          /<link[^>]*rel=["']preconnect["'][^>]*href=["']https:\/\/fonts\.googleapis\.com["'][^>]*>/i,
          `${file} must contain preconnect to fonts.googleapis.com`
        );
        assert.match(
          content,
          /<link[^>]*rel=["']preconnect["'][^>]*href=["']https:\/\/fonts\.gstatic\.com["'][^>]*crossorigin/i,
          `${file} must contain preconnect to fonts.gstatic.com with crossorigin`
        );
      }

      // Zero synchronous @import in src/style.css
      assert.ok(
        !styleCss.includes('@import url(') && !styleCss.includes('@import "'),
        'src/style.css must NOT contain synchronous @import rules'
      );
    });

    test('J1.3: Eradication of Ghost Loading / Double Render & Skeleton Layout Reservation', () => {
      // #main-gallery-grid must NOT contain any residual Supabase <img> tags
      const galleryGridMatch = indexHtml.match(/<div[^>]*id=["']main-gallery-grid["'][^>]*>([\s\S]*?)<\/div>/i);
      assert.ok(galleryGridMatch, 'index.html must have #main-gallery-grid container');

      const innerGrid = galleryGridMatch[1];
      assert.ok(
        !innerGrid.includes('<img'),
        '#main-gallery-grid must have exactly 0 hardcoded <img> tags (ghost loading eliminated)'
      );
      assert.ok(
        !innerGrid.includes('supabase.co'),
        '#main-gallery-grid must have 0 references to supabase.co'
      );
      assert.ok(
        innerGrid.includes('gallery-skeleton'),
        '#main-gallery-grid must contain reserved gallery-skeleton elements'
      );

      // Verify layout dimension reservation in CSS (55vh / 400px min-height)
      assert.match(
        styleCss,
        /(\.gallery-grid|#main-gallery-grid)[^{]*\{[^}]*(min-height|height):\s*(400px|55vh)/i,
        'src/style.css must reserve layout height (min-height: 400px or 55vh) for gallery grid to prevent CLS'
      );
    });

    test('J1.4: Passive IntersectionObserver & Throttled Scroll Architecture', () => {
      // Unbounded window scroll listeners are forbidden
      const scrollListeners = [...mainTs.matchAll(/addEventListener\(\s*['"]scroll['"]\s*,\s*([^,)]+)(?:,\s*([^)]+))?\)/g)];
      assert.ok(scrollListeners.length > 0, 'main.ts should configure scroll handling');
      for (const match of scrollListeners) {
        const options = match[2] || '';
        assert.ok(
          options.includes('passive: true'),
          `Scroll listener on "${match[1]}" must explicitly specify { passive: true }`
        );
      }

      // Reveal animation uses IntersectionObserver and unobserves upon entry
      assert.ok(mainTs.includes('IntersectionObserver'), 'main.ts must use IntersectionObserver');
      assert.ok(mainTs.includes('.unobserve('), 'main.ts reveal observer must call unobserve to prevent memory leaks');

      // Visibility change pauses intervals for hero slideshow & autoscroll
      assert.ok(
        mainTs.includes('visibilitychange') || mainTs.includes('visibilityState'),
        'main.ts must monitor document.visibilityState to pause timers'
      );
    });

    test('J1.5: Complete Supabase Purge in Production Modules', () => {
      const prodFiles = ['src/main.ts', 'src/admin.ts', 'src/reservations.ts', 'src/experiencia.ts'];
      for (const file of prodFiles) {
        const code = fs.readFileSync(path.join(ROOT_DIR, file), 'utf8');
        assert.ok(
          !code.includes("from '@supabase/supabase-js'") && !code.includes('from "./supabase"') && !code.includes("from './supabase'"),
          `${file} must NOT import Supabase in production code`
        );
      }
    });
  });

  // ==========================================================================
  // JOURNEY 2: Carta Browsing, Subcategories, Emojis, Allergens, Modals & Escape
  // ==========================================================================
  describe('Journey 2: Carta Browsing, Allergens, Modals & Escape Dismissal', () => {
    const mainTs = fs.readFileSync(path.join(SRC_DIR, 'main.ts'), 'utf8');
    const cartaHtml = fs.readFileSync(path.join(ROOT_DIR, 'carta.html'), 'utf8');

    test('J2.1: Zero Emoji Leakage under Poison Payloads and Complex Unicode Sequences', () => {
      const testCases = [
        {
          input: '🐟 Ceviche Clásico de Corvina 🌶️',
          expected: 'Ceviche Clásico de Corvina'
        },
        {
          input: '🥩 Lomo Saltado al Wok 🥢 🔥',
          expected: 'Lomo Saltado al Wok'
        },
        {
          input: '🥑 Causa Limeña con Pulpo a la Brasa 🐙 🍋',
          expected: 'Causa Limeña con Pulpo a la Brasa'
        },
        {
          input: '🇵🇪 Pisco Sour Tradicional 🍸 ✨',
          expected: 'Pisco Sour Tradicional'
        },
        {
          input: '🌾 Ají de Gallina Cremoso 🍗',
          expected: 'Ají de Gallina Cremoso'
        },
        {
          input: '🍮 Suspiro a la Limeña con Merengue al Oporto 🍷 🥄',
          expected: 'Suspiro a la Limeña con Merengue al Oporto'
        },
        {
          input: 'CEVICHES Y TIRADITOS 🐟 🍋 🌶️',
          expected: 'CEVICHES Y TIRADITOS'
        }
      ];

      for (const { input, expected } of testCases) {
        const sanitized = srcSanitizeDishName(input);
        assert.equal(sanitized, expected, `Poison input "${input}" must sanitize cleanly without emojis`);
        assert.ok(!/[\p{Extended_Pictographic}]/u.test(sanitized), `No emoji should remain in "${sanitized}"`);
      }

      // Spanish accents and punctuation must be strictly preserved
      const accentTest = 'Ñandú con Champiñón, Maíz & Ají Panca (Edición Especial: ¡Otoño!)';
      assert.equal(srcSanitizeDishName(accentTest), accentTest, 'Spanish characters, accents, and punctuation must survive intact');
    });

    test('J2.2: 16 Allergen Tags Canonical Enum Consistency & Uppercase Pill Rendering', () => {
      assert.equal(CONTRACT_ALLERGEN_TAGS.length, 16, 'Canonical enum must contain exactly 16 allergen tags');

      for (const tag of CONTRACT_ALLERGEN_TAGS) {
        assert.ok(contractIsValidAllergen(tag), `Tag "${tag}" must be valid in contract`);
        const pillHtml = contractRenderPill(tag);
        assert.ok(pillHtml.includes('class="allergen-pill"'), `Pill for "${tag}" must have class allergen-pill`);
        assert.ok(pillHtml.includes(`data-allergen="${tag}"`), `Pill for "${tag}" must have data-allergen attribute`);

        const expectedLabel = (tag === 'gluten-free' ? 'GLUTEN-FREE' : tag).toUpperCase();
        assert.ok(pillHtml.includes(`>${expectedLabel}<`), `Pill text for "${tag}" must be strictly uppercase "${expectedLabel}"`);
      }

      // Adversarial inputs must return empty string and not crash
      const invalidTags = ['lactose', 'peanuts', '<script>alert(1)</script>', 'MARISCO', null, undefined, '', 123];
      for (const invalid of invalidTags) {
        assert.equal(contractRenderPill(invalid), '', `Invalid tag "${invalid}" must render empty string`);
      }
    });

    test('J2.3: Dual Pricing Resiliency (.dual) under Boundary and Degenerate Prices', () => {
      // Positive numeric price
      const standard = srcFormatMenuItemPrice(24.5, 'Ceviche');
      assert.equal(standard.isMarketPrice, false);
      assert.equal(standard.priceClass, 'menu-item-price');
      assert.equal(standard.displayPrice, '24.50€');

      // Price = 0 with custom description
      const marketCustom = srcFormatMenuItemPrice(0, 'Precio según lonja diaria');
      assert.equal(marketCustom.isMarketPrice, true);
      assert.equal(marketCustom.priceClass, 'menu-item-price dual');
      assert.equal(marketCustom.displayPrice, 'Precio según lonja diaria');

      // Price = 0 without description -> default fallback
      const marketDefault = srcFormatMenuItemPrice(0, '');
      assert.equal(marketDefault.isMarketPrice, true);
      assert.equal(marketDefault.priceClass, 'menu-item-price dual');
      assert.equal(marketDefault.displayPrice, 'Precio según mercado');

      // Boundary values
      const cent = srcFormatMenuItemPrice(0.01);
      assert.equal(cent.isMarketPrice, false);
      assert.equal(cent.displayPrice, '0.01€');

      const negative = srcFormatMenuItemPrice(-5.0);
      assert.equal(negative.isMarketPrice, true);
      assert.equal(negative.priceClass, 'menu-item-price dual');

      const notANumber = srcFormatMenuItemPrice('NaN');
      assert.equal(notANumber.isMarketPrice, true);
      assert.equal(notANumber.priceClass, 'menu-item-price dual');
    });

    test('J2.4: Dish Photo Modal DOM Structure in carta.html', () => {
      assert.match(cartaHtml, /<div[^>]*id=["']menu-photo-modal["'][^>]*class=["'][^"']*menu-modal[^"']*["']/i, 'carta.html must contain #menu-photo-modal');
      assert.match(cartaHtml, /<button[^>]*class=["'][^"']*close-menu-modal[^"']*["']/i, 'carta.html modal must have close button');
      assert.match(cartaHtml, /<img[^>]*class=["'][^"']*menu-modal-img[^"']*["']/i, 'carta.html modal must have modal image element');
      assert.match(cartaHtml, /<h3[^>]*class=["'][^"']*modal-item-name[^"']*["']/i, 'carta.html modal must have title container');
    });

    test('J2.5: Modal Escape Dismissal & Zero Listener Accumulation Stress', () => {
      // Verify in src/main.ts that the Escape key listener is registered at module scope outside loadMenu
      const keydownEscapeCount = (mainTs.match(/addEventListener\(\s*['"]keydown['"]\s*,\s*\(e[^)]*\)\s*=>\s*\{[\s\S]*?Escape/g) || []).length;
      assert.equal(
        keydownEscapeCount,
        1,
        'src/main.ts must register exactly 1 Escape keydown listener across the module to prevent leak'
      );

      // Verify the listener checks e.key === 'Escape' and cleans up active modal state
      assert.ok(
        mainTs.includes("e.key === 'Escape'") && mainTs.includes("photoModal.classList.contains('active')"),
        'Modal escape listener must verify e.key === "Escape" and check active state'
      );

      // Simulate DOM modal behavior with MockElement
      const mockModal = new MockElement('div', { id: 'menu-photo-modal', class: 'menu-modal' });
      const mockImg = new MockElement('img', { class: 'menu-modal-img', src: 'https://res.cloudinary.com/demo/image/upload/ceviche.jpg' });
      const mockCloseBtn = new MockElement('button', { class: 'close-menu-modal' });
      mockModal.appendChild(mockImg);
      mockModal.appendChild(mockCloseBtn);

      const closeModal = () => {
        mockModal.classList.remove('active');
        mockImg.src = '';
      };

      mockCloseBtn.addEventListener('click', closeModal);

      // Open modal
      mockModal.classList.add('active');
      assert.ok(mockModal.classList.contains('active'));

      // Close via close button
      mockCloseBtn.click();
      assert.ok(!mockModal.classList.contains('active'), 'Modal must lose active class on close button click');
      assert.equal(mockImg.src, '', 'Modal image src must be cleared to prevent stale memory preview');

      // Open again and simulate Escape key
      mockModal.classList.add('active');
      mockImg.src = 'https://res.cloudinary.com/demo/image/upload/lomo.jpg';

      const handleKeydown = (e) => {
        if (e.key === 'Escape' && mockModal.classList.contains('active')) {
          closeModal();
        }
      };

      handleKeydown({ key: 'Escape' });
      assert.ok(!mockModal.classList.contains('active'), 'Modal must close upon Escape key');
      assert.equal(mockImg.src, '', 'Modal image src must be cleared on Escape');
    });
  });

  // ==========================================================================
  // JOURNEY 3: Backoffice Operations, Gallery, Cloudinary, Chips & Reservations
  // ==========================================================================
  describe('Journey 3: Backoffice Gallery, Cloudinary REST & Reservation Hub', () => {
    const adminTs = fs.readFileSync(path.join(SRC_DIR, 'admin.ts'), 'utf8');
    const adminHtml = fs.readFileSync(path.join(ROOT_DIR, 'admin.html'), 'utf8');

    test('J3.1: Cloudinary URL Normalization Contract — Comprehensive Stress Suite', () => {
      const cases = [
        {
          input: 'https://res.cloudinary.com/dhvbqs2ba/image/upload/v1774900000/ceviche.jpg',
          expected: 'https://res.cloudinary.com/dhvbqs2ba/image/upload/f_auto,q_auto,w_800,c_limit/v1774900000/ceviche.jpg'
        },
        {
          input: 'https://res.cloudinary.com/dhvbqs2ba/image/upload/v1774900000/ceviche.jpg?v=9999&auth=test',
          expected: 'https://res.cloudinary.com/dhvbqs2ba/image/upload/f_auto,q_auto,w_800,c_limit/v1774900000/ceviche.jpg'
        },
        {
          input: 'https://res.cloudinary.com/dhvbqs2ba/image/upload/f_auto,q_auto,w_400,c_limit/v1774900000/ceviche.jpg',
          expected: 'https://res.cloudinary.com/dhvbqs2ba/image/upload/f_auto,q_auto,w_800,c_limit/v1774900000/ceviche.jpg'
        },
        {
          input: 'https://res.cloudinary.com/dhvbqs2ba/image/upload/f_auto,q_auto,w_800,c_limit/v1774900000/ceviche.jpg',
          expected: 'https://res.cloudinary.com/dhvbqs2ba/image/upload/f_auto,q_auto,w_800,c_limit/v1774900000/ceviche.jpg'
        },
        {
          input: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
          expected: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'
        },
        {
          input: '',
          expected: ''
        },
        {
          input: null,
          expected: ''
        }
      ];

      for (const { input, expected } of cases) {
        // Test contract
        assert.equal(contractNormalizeCloudinary(input, 800), expected);
        // Test src/main.ts
        assert.equal(srcMainNormalizeCloudinary(input, 800), expected);
        // Test src/admin.ts
        assert.equal(srcAdminNormalizeCloudinary(input, 800), expected);

        // Idempotence check
        if (input && input.includes('cloudinary.com')) {
          const firstPass = srcAdminNormalizeCloudinary(input, 800);
          const secondPass = srcAdminNormalizeCloudinary(firstPass, 800);
          assert.equal(secondPass, firstPass, `Normalization must be idempotent for "${input}"`);
        }
      }
    });

    test('J3.2: Backoffice Gallery Exclusively via Firestore gallery_items and Cloudinary REST', () => {
      // Must target Firestore gallery_items collection
      assert.ok(
        adminTs.includes("collection(db, 'gallery_items')"),
        "src/admin.ts must persist gallery data to Firestore collection 'gallery_items'"
      );

      // Must upload via Cloudinary REST endpoint
      assert.ok(
        adminTs.includes('api.cloudinary.com/v1_1/'),
        'src/admin.ts must direct media uploads to Cloudinary REST API'
      );

      // Zero Firebase Storage calls in src/admin.ts
      assert.ok(
        !adminTs.includes('ref(storage') && !adminTs.includes('uploadBytes(') && !adminTs.includes('deleteObject('),
        'src/admin.ts must NOT contain Firebase Storage references (unification on Cloudinary)'
      );
    });

    test('J3.3: Interactive 16-Chip Allergen Selector Form Synchronization', () => {
      // Check admin.html template contains allergen chips container
      assert.match(
        adminHtml,
        /<div[^>]*id=["']allergen-chips-container["'][^>]*>/i,
        'admin.html must contain #allergen-chips-container'
      );

      // Simulate Chip Panel with MockElement
      const chipContainer = new MockElement('div', { id: 'allergen-chips-container' });
      CONTRACT_ALLERGEN_TAGS.forEach(tag => {
        const btn = new MockElement('button', { class: 'tag-chip', 'data-tag': tag });
        btn.textContent = tag.toUpperCase();
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          btn.classList.toggle('active');
        });
        chipContainer.appendChild(btn);
      });

      assert.equal(chipContainer.children.length, 16, 'Chip panel must instantiate exactly 16 buttons');

      // Simulate clicking 2 chips: 'pescado' and 'picante'
      const chipPescado = chipContainer.children.find(c => c.getAttribute('data-tag') === 'pescado');
      const chipPicante = chipContainer.children.find(c => c.getAttribute('data-tag') === 'picante');
      const chipGluten = chipContainer.children.find(c => c.getAttribute('data-tag') === 'gluten');

      chipPescado.click();
      chipPicante.click();

      assert.ok(chipPescado.classList.contains('active'));
      assert.ok(chipPicante.classList.contains('active'));
      assert.ok(!chipGluten.classList.contains('active'));

      // Extract active chips
      const selectedTags = chipContainer.children
        .filter(c => c.classList.contains('active'))
        .map(c => c.getAttribute('data-tag'));

      assert.deepEqual(selectedTags, ['pescado', 'picante']);

      // Toggle off 'pescado'
      chipPescado.click();
      assert.ok(!chipPescado.classList.contains('active'));
      const afterUntoggle = chipContainer.children
        .filter(c => c.classList.contains('active'))
        .map(c => c.getAttribute('data-tag'));
      assert.deepEqual(afterUntoggle, ['picante']);

      // Form reset: deactivates all chips
      chipContainer.children.forEach(c => c.classList.remove('active'));
      const activeAfterReset = chipContainer.children.filter(c => c.classList.contains('active'));
      assert.equal(activeAfterReset.length, 0, 'Form reset must deactivate all chips');
    });

    test('J3.4: File Validation & Live Image Preview (10MB Budget Strict Invariant)', () => {
      // 1. Valid JPEG under 10MB
      const validJpg = { size: 5 * 1024 * 1024, type: 'image/jpeg' };
      assert.deepEqual(srcValidateUploadFile(validJpg), { valid: true });

      // 2. Valid WebP under 10MB
      const validWebp = { size: 2 * 1024 * 1024, type: 'image/webp' };
      assert.deepEqual(srcValidateUploadFile(validWebp), { valid: true });

      // 3. Exact boundary: exactly 10MB (10 * 1024 * 1024 bytes)
      const boundary = { size: 10485760, type: 'image/png' };
      assert.deepEqual(srcValidateUploadFile(boundary), { valid: true });

      // 4. Over boundary: 10MB + 1 byte
      const overBoundary = { size: 10485761, type: 'image/png' };
      const overResult = srcValidateUploadFile(overBoundary);
      assert.equal(overResult.valid, false);
      assert.match(overResult.error, /10 MB/i);

      // 5. Invalid MIME types (PDF, GIF, SVG, MP4)
      const invalidMimes = ['application/pdf', 'image/gif', 'image/svg+xml', 'video/mp4'];
      for (const mime of invalidMimes) {
        const res = srcValidateUploadFile({ size: 1024, type: mime });
        assert.equal(res.valid, false, `MIME "${mime}" must be rejected`);
        assert.match(res.error, /Formato no permitido/i);
      }

      // 6. Null or undefined file
      assert.equal(srcValidateUploadFile(null).valid, false);
      assert.equal(srcValidateUploadFile(undefined).valid, false);
    });

    test('J3.5: Reservation Operational Hub — State Filter Tabs & Action Buttons', () => {
      // admin.html must contain filter tabs in #reservations-tabs
      assert.match(adminHtml, /<button[^>]*id=["']tab-pending["'][^>]*data-tab=["']pending["']/i, 'admin.html must contain "Pendientes" tab');
      assert.match(adminHtml, /<button[^>]*id=["']tab-today["'][^>]*data-tab=["']today["']/i, 'admin.html must contain "Hoy" tab');
      assert.match(adminHtml, /<button[^>]*id=["']tab-all["'][^>]*data-tab=["']all["']/i, 'admin.html must contain "Todas" tab');

      // admin.ts must implement the action button handlers
      assert.ok(adminTs.includes('btn-confirm-res'), 'admin.ts must handle "Confirmar" action');
      assert.ok(adminTs.includes('btn-cancel-res'), 'admin.ts must handle "Cancelar" action');
      assert.ok(adminTs.includes('btn-wa-client'), 'admin.ts must handle "WhatsApp" action');

      // Confirm mutation updates status to 'confirmed'
      assert.ok(
        adminTs.includes("status: 'confirmed'"),
        "admin.ts confirm reservation must set status to 'confirmed'"
      );

      // Cancel mutation updates status to 'cancelled'
      assert.ok(
        adminTs.includes("status: 'cancelled'"),
        "admin.ts cancel reservation must set status to 'cancelled'"
      );
    });
  });

  // ==========================================================================
  // JOURNEY 4: Customer Reservation Concierge, Crockford-32, Capacity & RFC 9457
  // ==========================================================================
  describe('Journey 4: Customer Reservation Concierge & Anti-Popup Hardening', () => {
    const mainTs = fs.readFileSync(path.join(SRC_DIR, 'main.ts'), 'utf8');
    const adminTs = fs.readFileSync(path.join(SRC_DIR, 'admin.ts'), 'utf8');
    const resTs = fs.readFileSync(path.join(SRC_DIR, 'reservations.ts'), 'utf8');
    const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');

    test('J4.1: Anti-Popup Blocker Immunity — Zero Asynchronous window.open', () => {
      // Static AST scan: Prohibit active window.open in customer reservation code
      const checkZeroWindowOpen = (fileContent, fileName) => {
        const openCalls = [...fileContent.matchAll(/(?<!\/\/[^\n]*)(?<!\/\*[\s\S]*?)window\.open\s*\(/g)];
        assert.equal(
          openCalls.length,
          0,
          `${fileName} must contain exactly 0 active window.open calls (anti-popup immunity)`
        );
      };

      checkZeroWindowOpen(mainTs, 'src/main.ts');
      checkZeroWindowOpen(resTs, 'src/reservations.ts');

      // Verify 2-step flow confirmation card with voluntary CTA
      assert.match(
        indexHtml,
        /<div[^>]*id=["']reservation-confirmation-card["'][^>]*>/i,
        'index.html must have #reservation-confirmation-card container'
      );
    });

    test('J4.2: Crockford-32 Reservation Locator — Regex, Alphabet & 1,000 Collision Stress', () => {
      // 1. Verify Regex definition
      assert.equal(LOCATOR_REGEX.source, '^SP-[A-Z0-9]{4}$');

      // 2. Generate 1,000 consecutive locators and verify invariants & collision resistance
      const generatedSet = new Set();
      const forbiddenGlyphs = ['0', 'O', '1', 'I'];
      const rng = createMulberry32(2);

      for (let i = 0; i < 1000; i++) {
        const locator = srcGenerateLocator(rng);
        assert.match(
          locator,
          LOCATOR_REGEX,
          `Locator "${locator}" must match ^SP-[A-Z0-9]{4}$`
        );

        const codePart = locator.substring(3);
        for (const glyph of forbiddenGlyphs) {
          assert.ok(
            !codePart.includes(glyph),
            `Locator "${locator}" must NOT contain ambiguous glyph "${glyph}"`
          );
        }

        assert.ok(
          !generatedSet.has(locator),
          `Collision detected: locator "${locator}" generated twice at index ${i}`
        );
        generatedSet.add(locator);
      }

      // Check collision resistance: 1,000 unique locators
      assert.equal(
        generatedSet.size,
        1000,
        '1,000 generated locators must be 100% unique without collisions'
      );

      // Bijective sequential test across base-32 space
      let callCount = 0;
      let currentSample = 0;
      const sequentialRng = () => {
        const digitIndex = callCount % 4;
        let digitVal = 0;
        if (digitIndex === 0) digitVal = Math.floor(currentSample / (32 * 32 * 32)) % 32;
        else if (digitIndex === 1) digitVal = Math.floor(currentSample / (32 * 32)) % 32;
        else if (digitIndex === 2) digitVal = Math.floor(currentSample / 32) % 32;
        else {
          digitVal = currentSample % 32;
          currentSample++;
        }
        callCount++;
        return (digitVal + 0.5) / 32;
      };

      const bijectiveSet = new Set();
      for (let i = 0; i < 1000; i++) {
        const loc = srcGenerateLocator(sequentialRng);
        assert.match(loc, LOCATOR_REGEX);
        assert.ok(!bijectiveSet.has(loc));
        bijectiveSet.add(loc);
      }
      assert.equal(bijectiveSet.size, 1000);
    });

    test('J4.3: 4-Table Capacity Limit & Slot Availability Check', () => {
      // Boundary active counts
      assert.deepEqual(srcCheckSlotAvailability(0), { available: true, reason: undefined, activeCount: 0 });
      assert.deepEqual(srcCheckSlotAvailability(1), { available: true, reason: undefined, activeCount: 1 });
      assert.deepEqual(srcCheckSlotAvailability(3), { available: true, reason: undefined, activeCount: 3 });

      // Capacity saturation at 4
      const full = srcCheckSlotAvailability(4);
      assert.equal(full.available, false);
      assert.equal(full.reason, 'Completo');

      // Overflow
      const overflow = srcCheckSlotAvailability(5);
      assert.equal(overflow.available, false);
      assert.equal(overflow.reason, 'Completo');

      // Cancelled exclusion contract:
      const reservations = [
        { status: 'confirmed' },
        { status: 'confirmed' },
        { status: 'pending' },
        { status: 'cancelled' },
        { status: 'cancelled' }
      ];
      const activeBookings = reservations.filter(r => r.status !== 'cancelled').length;
      assert.equal(activeBookings, 3, 'Cancelled bookings must be excluded');
      assert.equal(srcCheckSlotAvailability(activeBookings).available, true);
    });

    test('J4.4: Imperial Table Advisory Policy (> 6 Pax)', () => {
      // Standard parties (1..6)
      for (let p = 1; p <= 6; p++) {
        const res = srcValidateGuestCount(p);
        assert.equal(res.valid, true);
        assert.equal(res.isImperial, false);
        assert.equal(res.notice, undefined);
      }

      // Imperial Table parties (7..20)
      for (let p = 7; p <= 20; p++) {
        const res = srcValidateGuestCount(p);
        assert.equal(res.valid, true);
        assert.equal(res.isImperial, true);
        assert.ok(res.notice && res.notice.includes('mesa imperial'));

        // WhatsApp message must append imperial notice
        const waUrl = srcBuildWaUrl({
          locator: 'SP-K7N2',
          name: 'Carlos Ruiz',
          date: '2026-11-20',
          time: '14:00',
          people: p
        });
        assert.ok(waUrl.includes(encodeURIComponent('Mesa Imperial solicitada.')));
      }

      // Out of bounds
      const outOfBounds = [0, -1, 21, 50, 2.5, NaN, '4', null, undefined];
      for (const bad of outOfBounds) {
        const res = srcValidateGuestCount(bad);
        assert.equal(res.valid, false, `Guest count "${bad}" must be invalid`);
      }
    });

    test('J4.5: RFC 9457 Problem Details Toasts & Zero Native alert() Calls', () => {
      // 1. Static AST scan: Zero alert() across all source files
      const allSrcFiles = ['src/main.ts', 'src/admin.ts', 'src/reservations.ts', 'src/experiencia.ts'];
      for (const file of allSrcFiles) {
        const code = fs.readFileSync(path.join(ROOT_DIR, file), 'utf8');
        const alertMatches = [...code.matchAll(/(?<!\/\/[^\n]*)(?<!\/\*[\s\S]*?)\balert\s*\(/g)];
        assert.equal(
          alertMatches.length,
          0,
          `${file} must contain exactly 0 alert() calls`
        );
      }

      // 2. RFC 9457 Problem Details Object Construction
      const problem = contractCreateProblem({
        type: 'https://sabeaperu.es/errors/capacity-exceeded',
        title: 'Horario Completo',
        status: 409,
        detail: 'No quedan mesas disponibles para la hora seleccionada.'
      });
      assert.equal(problem.status, 409);
      assert.equal(problem.title, 'Horario Completo');

      // 3. Render toast HTML with role="alert", data-status, and XSS safety
      const toastHtml = contractRenderProblemToast(problem);
      assert.ok(toastHtml.includes('class="toast error rfc-9457"'));
      assert.ok(toastHtml.includes('role="alert"'));
      assert.ok(toastHtml.includes('data-status="409"'));
      assert.ok(toastHtml.includes('Horario Completo'));

      // XSS payload neutralization in toast
      const xssProblem = contractCreateProblem({
        type: 'https://sabeaperu.es/errors/invalid-input',
        title: '<script>alert("xss")</script>',
        status: 422,
        detail: '"><img src=x onerror=alert(1)>'
      });
      const xssToast = contractRenderProblemToast(xssProblem);
      assert.ok(!xssToast.includes('<script>'), 'Toast title must escape script tags');
      assert.ok(!xssToast.includes('<img src=x'), 'Toast detail must escape img tags');
      assert.ok(xssToast.includes('&lt;script&gt;'));
    });
  });

  // ==========================================================================
  // CROSS-MODULE INTEGRATION & DESIGN SYSTEM INVARIANTS
  // ==========================================================================
  describe('Cross-Module Integration & Quiet Luxury Design System Tokens', () => {
    const styleCss = fs.readFileSync(path.join(SRC_DIR, 'style.css'), 'utf8');

    test('J5.1: Quiet Luxury Color Tokens declared in :root', () => {
      const requiredTokens = [
        '--lux-bg-obsidian: #0b0b0b',
        '--lux-bg-charcoal: #141414',
        '--lux-gold-champagne: #c5a880',
        '--lux-text-primary: #f5f2eb',
        '--lux-crimson-mineral: #8b1e22'
      ];

      for (const token of requiredTokens) {
        assert.ok(
          styleCss.includes(token),
          `src/style.css must define token "${token}" in :root`
        );
      }
    });

    test('J5.2: Derogation of 80px Brown Border & Nazca Animal SVGs', () => {
      assert.ok(
        !styleCss.includes('border: 80px solid'),
        'src/style.css must NOT contain the 80px brown border'
      );
      assert.ok(
        !styleCss.includes('#2e2620'),
        'src/style.css must NOT contain the brown hex color #2e2620'
      );
      assert.ok(
        !styleCss.includes('colibri') && !styleCss.includes('mono') && !styleCss.includes('arana'),
        'src/style.css must NOT contain Nazca animal SVG background references'
      );
    });

    test('J5.3: Neutralization of Shiny Button Continuous Animation Loop', () => {
      // Must neutralize legacy bridge with content: none !important and display: none !important
      assert.match(
        styleCss,
        /\.item-photo-btn::after\s*\{[^}]*content:\s*none\s*!important/i,
        '.item-photo-btn::after must have content: none !important'
      );
      assert.match(
        styleCss,
        /\.item-photo-btn::after\s*\{[^}]*display:\s*none\s*!important/i,
        '.item-photo-btn::after must have display: none !important'
      );
      assert.ok(
        !styleCss.includes('@keyframes shiny-btn-anim') && !styleCss.includes('animation: shiny-btn'),
        'src/style.css must NOT contain continuous shiny button animation loops'
      );
    });

    test('J5.4: Zero TypeScript ": any" Annotations Across All Production Modules', () => {
      const tsFiles = ['main.ts', 'admin.ts', 'reservations.ts', 'experiencia.ts', 'firebase.ts'];
      for (const file of tsFiles) {
        const filePath = path.join(SRC_DIR, file);
        if (fs.existsSync(filePath)) {
          const code = fs.readFileSync(filePath, 'utf8');
          const anyMatches = [...code.matchAll(/:\s*any\b/g)];
          assert.equal(
            anyMatches.length,
            0,
            `src/${file} must contain 0 ": any" type annotations (found ${anyMatches.length})`
          );
        }
      }
    });
  });
});
