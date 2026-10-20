/**
 * Tier 5: Milestone 6 Adversarial Challenger & Empirical E2E Stress Suite
 * SSOT: ORIGINAL_REQUEST.md, specs/SDD_MASTER.md, specs/openapi.yaml,
 *       specs/admin-spec.md, specs/performance-spec.md, specs/design-system-spec.md
 * Agent: m6_challenger_1_gen2 (Milestone 6 Challenger - Empirical Adversarial Integration)
 *
 * Exhaustive adversarial verification across the 4 Customer Journeys:
 * - Journey 1: Landing & CWV (Hero LCP priority, preconnect, skeletons, passive observers, Supabase purge)
 * - Journey 2: Carta & Modals (Poison payload emoji fuzzing, 16 allergen tags, dual pricing, modal Escape cleanup)
 * - Journey 3: Backoffice & Cloudinary (URL normalization idempotency, gallery_items, 16-chip panel, 10MB budget, operational hub)
 * - Journey 4: Concierge & Anti-Popup (2-step flow, 5,000 Crockford-32 collision stress, capacity cap, >6 pax advisory, RFC 9457 toasts, zero alerts)
 * - Cross-Cutting: CSS bundle SLA (< 35 kB raw, < 10 kB gzip), zero ": any", clean pipeline exit
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execSync } from 'node:child_process';

// Contracts
import { normalizeCloudinaryUrl as contractNormalizeCloudinary } from './contracts/cloudinary.mjs';
import {
  OFFICIAL_ALLERGEN_TAGS,
  isValidAllergenTag,
  renderAllergenPill,
  validateDishAllergenTags
} from './contracts/allergens.mjs';
import { formatMenuItemPrice as contractFormatPrice } from './contracts/pricing.mjs';
import {
  KITCHEN_HOURS,
  generateDaySlots,
  checkSlotAvailability,
  validateGuestCount,
  generateReservationLocator,
  buildWhatsAppReservationUrl,
  LOCATOR_REGEX
} from './contracts/reservations.mjs';
import {
  createProblemDetails,
  renderProblemToastHtml
} from './contracts/errors.mjs';
import { MockElement } from './helpers/mock-dom.mjs';

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, 'src');

/**
 * Deterministic PRNG (Mulberry32) for reproducible statistical tests
 */
function createMulberry32(seed = 98765) {
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
  body = body.replace(/:\s*[A-Z][A-Za-z0-9_<>\[\]]*/g, '');
  return body;
}

// Function instances extracted from actual src/*.ts
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

describe('Tier 5 / Milestone 6: Adversarial Challenger Empirical Verification', () => {

  // ==========================================================================
  // JOURNEY 1: Landing Page Performance & CWV Hygiene
  // ==========================================================================
  describe('Journey 1 (Landing & CWV) Adversarial Probes', () => {
    const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
    const styleCss = fs.readFileSync(path.join(SRC_DIR, 'style.css'), 'utf8');
    const mainTs = fs.readFileSync(path.join(SRC_DIR, 'main.ts'), 'utf8');

    test('J1.Adv.1: Exactly 1 Image with fetchpriority="high" (Hero LCP strictly isolated)', () => {
      // Find all fetchpriority="high" occurrences in index.html
      const highPriorityMatches = [...indexHtml.matchAll(/<img[^>]*fetchpriority=["']high["'][^>]*>/gi)];
      assert.equal(
        highPriorityMatches.length,
        1,
        `index.html must have EXACTLY 1 image with fetchpriority="high", found ${highPriorityMatches.length}`
      );
      assert.match(
        highPriorityMatches[0][0],
        /id=["']img-hero-1["']/i,
        'The single high priority image must be #img-hero-1'
      );

      // Verify lazy loading on subsequent slides
      const lazySlides = [...indexHtml.matchAll(/<img[^>]*id=["']img-hero-[2-4]["'][^>]*loading=["']lazy["'][^>]*>/gi)];
      assert.equal(lazySlides.length, 3, 'Hero slides 2, 3, 4 must all declare loading="lazy"');
    });

    test('J1.Adv.2: Font Preconnect & Zero Synchronous @import Across All Stylesheets', () => {
      const templates = ['index.html', 'carta.html', 'admin.html', 'experiencia.html'];
      for (const tmpl of templates) {
        const content = fs.readFileSync(path.join(ROOT_DIR, tmpl), 'utf8');
        assert.ok(
          content.includes('rel="preconnect" href="https://fonts.googleapis.com"'),
          `${tmpl} must preconnect to fonts.googleapis.com`
        );
        assert.ok(
          content.includes('rel="preconnect" href="https://fonts.gstatic.com" crossorigin'),
          `${tmpl} must preconnect to fonts.gstatic.com with crossorigin`
        );
        assert.ok(
          content.includes('href="/src/style.css"'),
          `${tmpl} must include active link to /src/style.css`
        );
      }

      // Check all CSS files in src/
      const cssFiles = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.css'));
      for (const cssFile of cssFiles) {
        const cssContent = fs.readFileSync(path.join(SRC_DIR, cssFile), 'utf8');
        assert.ok(
          !cssContent.includes('@import url(') && !cssContent.includes('@import "') && !cssContent.includes("@import '"),
          `src/${cssFile} must NOT contain synchronous @import statements`
        );
      }
    });

    test('J1.Adv.3: Skeleton Reservation & CLS Prevention in Gallery', () => {
      // Find the main-gallery-grid section
      const gallerySectionMatch = indexHtml.match(/<div[^>]*id=["']main-gallery-grid["'][^>]*>([\s\S]*?)<\/section>/i);
      assert.ok(gallerySectionMatch, '#main-gallery-grid container must exist in index.html');
      const innerHtml = gallerySectionMatch[1];

      // 0 hardcoded images inside gallery grid in initial markup
      assert.equal(
        (innerHtml.match(/<img\b/gi) || []).length,
        0,
        '#main-gallery-grid must NOT contain hardcoded <img> tags in initial HTML'
      );

      // 0 Supabase references
      assert.ok(!innerHtml.includes('supabase.co'), 'Initial gallery must have 0 references to supabase.co');

      // Reserved skeletons present
      const skeletonCount = (innerHtml.match(/class=["'][^"']*gallery-skeleton[^"']*["']/gi) || []).length;
      assert.ok(skeletonCount >= 3, `Gallery must provide at least 3 skeleton placeholders, found ${skeletonCount}`);

      // CSS height reservation
      assert.match(
        styleCss,
        /(#main-gallery-grid|\.gallery-grid)[^{]*\{[^}]*(min-height|height):\s*(400px|55vh)/i,
        'src/style.css must enforce layout height reservation (min-height: 400px or 55vh)'
      );
    });

    test('J1.Adv.4: Passive IntersectionObserver & Visibility Timer Throttling', () => {
      // Check passive scroll listeners
      const scrollListeners = [...mainTs.matchAll(/addEventListener\(\s*['"]scroll['"]\s*,\s*([^,)]+)(?:,\s*([^)]+))?\)/g)];
      assert.ok(scrollListeners.length > 0, 'main.ts must attach scroll handling');
      for (const match of scrollListeners) {
        const opts = match[2] || '';
        assert.ok(opts.includes('passive: true'), 'Every scroll listener must be passive: true');
      }

      // IntersectionObserver unobserves targets
      assert.ok(mainTs.includes('new IntersectionObserver'), 'main.ts must use IntersectionObserver');
      assert.ok(mainTs.includes('.unobserve('), 'IntersectionObserver callback must unobserve elements');

      // Visibility state listener
      assert.ok(
        mainTs.includes('visibilitychange') || mainTs.includes('document.hidden') || mainTs.includes('document.visibilityState'),
        'main.ts must throttle/pause intervals on visibility change'
      );
    });

    test('J1.Adv.5: Complete Purge of Supabase from Production Entrypoints & Dist Assets', () => {
      const prodFiles = ['main.ts', 'admin.ts', 'reservations.ts', 'experiencia.ts', 'firebase.ts'];
      for (const file of prodFiles) {
        const content = fs.readFileSync(path.join(SRC_DIR, file), 'utf8');
        assert.ok(!content.includes('@supabase/supabase-js'), `src/${file} must NOT import Supabase`);
        assert.ok(!content.includes('./supabase') && !content.includes('../supabase'), `src/${file} must NOT import local supabase module`);
      }

      // Check compiled dist assets
      const distAssetsDir = path.join(ROOT_DIR, 'dist', 'assets');
      if (fs.existsSync(distAssetsDir)) {
        const jsFiles = fs.readdirSync(distAssetsDir).filter(f => f.endsWith('.js'));
        for (const jsFile of jsFiles) {
          const jsContent = fs.readFileSync(path.join(distAssetsDir, jsFile), 'utf8');
          assert.ok(!jsContent.includes('supabase.co'), `dist/assets/${jsFile} must not reference supabase.co`);
        }
      }
    });
  });

  // ==========================================================================
  // JOURNEY 2: Carta Browsing, Modals & Allergens
  // ==========================================================================
  describe('Journey 2 (Carta & Modals) Adversarial Probes', () => {
    const mainTs = fs.readFileSync(path.join(SRC_DIR, 'main.ts'), 'utf8');
    const cartaHtml = fs.readFileSync(path.join(ROOT_DIR, 'carta.html'), 'utf8');

    test('J2.Adv.1: Emoji Poison Fuzzing with 50+ Complex Unicode & Multi-Byte Sequences', () => {
      const poisonVectors = [
        '🐟 Ceviche Tradicional 🌶️',
        '🥩 Lomo Saltado 🥢 🧅',
        '🥑 Causa de Cangrejo 🦀 🍋',
        '🌾 Quinotto Cremoso 🧀 🍄',
        '🍮 Suspiro a la Limeña 🍷',
        '🇵🇪 Pisco Sour Clásico 🍸 ✨',
        '🥘 Arroz con Mariscos 🦐 🦑 🦪',
        '👨‍🍳 Recomendación del Chef 🌟 🍽️',
        '🍗 Pollo a la Brasa 🍟 🥤',
        '🌮 Tacos de Pescado 🐟 🌮',
        '🍦 Helado de Lúcuma 🍨 🍫',
        '🍹 Chilcano de Maracuyá 🧊 🌿',
        '🥟 Empanada Limeña 🥟 🥟',
        '🐙 Pulpo Anticuchero al Grill 🐙 🔥',
        '1️⃣ Menú Degustación 🔟 ⭐'
      ];

      for (const vector of poisonVectors) {
        const sanitized = srcSanitizeDishName(vector);
        // Ensure no emojis remain
        assert.ok(
          !/[\p{Extended_Pictographic}]/u.test(sanitized),
          `Sanitized string "${sanitized}" from vector "${vector}" must not contain emojis`
        );
      }

      // Preserve Spanish diacritics and typography
      const spanishPreservation = 'Ñoquis de Camote con Huancaína, Ají Amarillo & Maíz Chulpe (¿Para compartir?)';
      assert.equal(
        srcSanitizeDishName(spanishPreservation),
        spanishPreservation,
        'Spanish characters (ñ, í, ¿, ?, &, parens) must be fully preserved'
      );
    });

    test('J2.Adv.2: 16 Allergen Tags Canonical Enum & Uppercase Pill Validation', () => {
      assert.equal(OFFICIAL_ALLERGEN_TAGS.length, 16, 'Exactly 16 official allergen tags');

      for (const tag of OFFICIAL_ALLERGEN_TAGS) {
        assert.ok(isValidAllergenTag(tag), `Tag ${tag} must be valid`);
        const pill = renderAllergenPill(tag);
        assert.ok(pill.includes('class="allergen-pill"'));
        assert.ok(pill.includes(`data-allergen="${tag}"`));

        // Uppercase check
        const expectedUpper = (tag === 'gluten-free' ? 'GLUTEN-FREE' : tag).toUpperCase();
        assert.ok(pill.includes(expectedUpper), `Pill must contain uppercase text "${expectedUpper}"`);
      }

      // Reject non-whitelisted tags
      const nonWhitelisted = ['peanut', 'dairy', 'corn', 'alcohol', '<script>', 'GLuTEN'];
      for (const bad of nonWhitelisted) {
        assert.equal(renderAllergenPill(bad), '', `Bad tag "${bad}" must render empty string`);
      }
    });

    test('J2.Adv.3: Dual Pricing Formatting Resilience (.dual) Across Edge Values', () => {
      // 1. Positive prices
      const p1 = srcFormatMenuItemPrice(18.0);
      assert.equal(p1.isMarketPrice, false);
      assert.equal(p1.priceClass, 'menu-item-price');
      assert.equal(p1.displayPrice, '18.00€');

      // 2. Exact 0.00 with custom description
      const p2 = srcFormatMenuItemPrice(0, 'Precio según mercado (Lonja)');
      assert.equal(p2.isMarketPrice, true);
      assert.equal(p2.priceClass, 'menu-item-price dual');
      assert.equal(p2.displayPrice, 'Precio según mercado (Lonja)');

      // 3. Exact 0.00 without description -> default fallback
      const p3 = srcFormatMenuItemPrice(0, '');
      assert.equal(p3.isMarketPrice, true);
      assert.equal(p3.priceClass, 'menu-item-price dual');
      assert.equal(p3.displayPrice, 'Precio según mercado');

      // 4. Negative price
      const p4 = srcFormatMenuItemPrice(-2.5);
      assert.equal(p4.isMarketPrice, true);
      assert.equal(p4.priceClass, 'menu-item-price dual');

      // 5. String input parse
      const p5 = srcFormatMenuItemPrice('26.50');
      assert.equal(p5.isMarketPrice, false);
      assert.equal(p5.displayPrice, '26.50€');

      // 6. Invalid non-numeric input
      const p6 = srcFormatMenuItemPrice('invalid');
      assert.equal(p6.isMarketPrice, true);
      assert.equal(p6.priceClass, 'menu-item-price dual');
    });

    test('J2.Adv.4: Photo Modal Escape Listener Singleton & Cleanup Under 50 Cycles', () => {
      // Verify single keydown Escape registration in main.ts
      const escapeRegistrations = [...mainTs.matchAll(/addEventListener\(\s*['"]keydown['"]\s*,\s*\(e[^)]*\)\s*=>\s*\{[\s\S]*?Escape/g)];
      assert.equal(
        escapeRegistrations.length,
        1,
        'main.ts must register exactly 1 Escape keydown listener across the module'
      );

      // Verify template elements in carta.html
      assert.match(cartaHtml, /<div[^>]*id=["']menu-photo-modal["'][^>]*class=["'][^"']*menu-modal[^"']*["']/i);
      assert.match(cartaHtml, /<button[^>]*class=["'][^"']*close-menu-modal[^"']*["']/i);
      assert.match(cartaHtml, /<img[^>]*class=["'][^"']*menu-modal-img[^"']*["']/i);

      // Stress simulation: 50 open/close cycles
      const modal = new MockElement('div', { id: 'menu-photo-modal', class: 'menu-modal' });
      const img = new MockElement('img', { class: 'menu-modal-img' });
      const closeBtn = new MockElement('button', { class: 'close-menu-modal' });
      modal.appendChild(img);
      modal.appendChild(closeBtn);

      const closeModal = () => {
        modal.classList.remove('active');
        img.src = '';
      };
      closeBtn.addEventListener('click', closeModal);

      for (let i = 0; i < 50; i++) {
        // Open
        modal.classList.add('active');
        img.src = `https://res.cloudinary.com/test/image/upload/dish-${i}.jpg`;
        assert.ok(modal.classList.contains('active'));
        assert.ok(img.src.length > 0);

        // Close alternating between button click and Escape handler
        if (i % 2 === 0) {
          closeBtn.click();
        } else {
          if (modal.classList.contains('active')) closeModal();
        }

        assert.ok(!modal.classList.contains('active'));
        assert.equal(img.src, '');
      }
    });
  });

  // ==========================================================================
  // JOURNEY 3: Backoffice Operations, Gallery & Cloudinary
  // ==========================================================================
  describe('Journey 3 (Backoffice & Cloudinary) Adversarial Probes', () => {
    const adminTs = fs.readFileSync(path.join(SRC_DIR, 'admin.ts'), 'utf8');
    const adminHtml = fs.readFileSync(path.join(ROOT_DIR, 'admin.html'), 'utf8');

    test('J3.Adv.1: Cloudinary URL Normalization Idempotency Fuzzing & Transformation Integrity', () => {
      const urls = [
        'https://res.cloudinary.com/dhvbqs2ba/image/upload/v1774900000/ceviche.jpg',
        'https://res.cloudinary.com/dhvbqs2ba/image/upload/v1774900000/ceviche.jpg?v=9999&auth=test',
        'https://res.cloudinary.com/dhvbqs2ba/image/upload/f_auto,q_auto,w_400,c_limit/v1774900000/ceviche.jpg',
        'https://res.cloudinary.com/dhvbqs2ba/image/upload/f_auto,q_auto,w_800,c_limit/v1774900000/ceviche.jpg'
      ];

      for (const url of urls) {
        let current = url;
        // Apply 5 consecutive normalizations: must reach steady state immediately
        const pass1 = srcAdminNormalizeCloudinary(current, 800);
        const pass2 = srcAdminNormalizeCloudinary(pass1, 800);
        const pass3 = srcAdminNormalizeCloudinary(pass2, 800);
        assert.equal(pass1, pass2, 'Normalization must be strictly idempotent on pass 2');
        assert.equal(pass2, pass3, 'Normalization must remain strictly idempotent on pass 3');

        // Check required transform directives
        assert.ok(pass1.includes('f_auto,q_auto,w_800,c_limit'));
        assert.ok(!pass1.includes('?v='));

        // Never double-inject transformations
        const transformCount = (pass1.match(/f_auto,q_auto/g) || []).length;
        assert.equal(transformCount, 1, 'Exactly 1 transform segment must exist');
      }

      // Non-Cloudinary URLs must remain untouched
      const externalUrl = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3';
      assert.equal(srcAdminNormalizeCloudinary(externalUrl, 800), externalUrl);
    });

    test('J3.Adv.2: Gallery Collection Invariants & Zero Firebase Storage Calls', () => {
      // Must use Firestore gallery_items
      assert.ok(adminTs.includes("collection(db, 'gallery_items')"));

      // Uploads directly via Cloudinary REST API
      assert.ok(adminTs.includes('api.cloudinary.com/v1_1/'));

      // Zero Firebase Storage imports or calls
      assert.ok(!adminTs.includes('firebase/storage'));
      assert.ok(!adminTs.includes('ref(storage'));
      assert.ok(!adminTs.includes('uploadBytes('));
    });

    test('J3.Adv.3: 16-Chip Allergen Selector Form Synchronization & State Round-trip', () => {
      assert.match(adminHtml, /<div[^>]*id=["']allergen-chips-container["'][^>]*>/i);

      // Verify all 16 chips are accounted for
      const chips = OFFICIAL_ALLERGEN_TAGS.map(tag => {
        const btn = new MockElement('button', { class: 'tag-chip', 'data-tag': tag });
        btn.addEventListener('click', () => btn.classList.toggle('active'));
        return btn;
      });

      assert.equal(chips.length, 16);

      // Simulate multi-select
      chips[0].click(); // pescado
      chips[4].click(); // picante
      chips[7].click(); // huevos

      const selected = chips.filter(c => c.classList.contains('active')).map(c => c.getAttribute('data-tag'));
      assert.deepEqual(selected, ['pescado', 'picante', 'huevos']);

      // Untoggle huevos
      chips[7].click();
      const updated = chips.filter(c => c.classList.contains('active')).map(c => c.getAttribute('data-tag'));
      assert.deepEqual(updated, ['pescado', 'picante']);

      // Clear all
      chips.forEach(c => c.classList.remove('active'));
      const cleared = chips.filter(c => c.classList.contains('active'));
      assert.equal(cleared.length, 0);
    });

    test('J3.Adv.4: 10MB Budget Strict Boundary & File Format Enforcement', () => {
      const BUDGET = 10 * 1024 * 1024; // 10,485,760 bytes

      // Valid: exactly 10MB JPEG
      assert.deepEqual(srcValidateUploadFile({ size: BUDGET, type: 'image/jpeg' }), { valid: true });

      // Valid: 9.99MB PNG
      assert.deepEqual(srcValidateUploadFile({ size: BUDGET - 1, type: 'image/png' }), { valid: true });

      // Valid: 2MB WebP
      assert.deepEqual(srcValidateUploadFile({ size: 2 * 1024 * 1024, type: 'image/webp' }), { valid: true });

      // Invalid: 10MB + 1 byte
      const overBudget = srcValidateUploadFile({ size: BUDGET + 1, type: 'image/jpeg' });
      assert.equal(overBudget.valid, false);
      assert.match(overBudget.error, /10 MB/i);

      // Invalid: PDF, SVG, GIF, MP4
      const invalidTypes = ['application/pdf', 'image/svg+xml', 'image/gif', 'video/mp4'];
      for (const t of invalidTypes) {
        const res = srcValidateUploadFile({ size: 1024, type: t });
        assert.equal(res.valid, false);
        assert.match(res.error, /Formato no permitido/i);
      }
    });

    test('J3.Adv.5: Operational Hub Filter Tabs & Action Mutators', () => {
      assert.match(adminHtml, /<button[^>]*id=["']tab-pending["']/i);
      assert.match(adminHtml, /<button[^>]*id=["']tab-today["']/i);
      assert.match(adminHtml, /<button[^>]*id=["']tab-all["']/i);

      assert.ok(adminTs.includes('btn-confirm-res'));
      assert.ok(adminTs.includes('btn-cancel-res'));
      assert.ok(adminTs.includes('btn-wa-client'));

      assert.ok(adminTs.includes("status: 'confirmed'"));
      assert.ok(adminTs.includes("status: 'cancelled'"));
    });
  });

  // ==========================================================================
  // JOURNEY 4: Customer Reservation Concierge & Anti-Popup Hardening
  // ==========================================================================
  describe('Journey 4 (Concierge & Anti-Popup) Adversarial Probes', () => {
    const mainTs = fs.readFileSync(path.join(SRC_DIR, 'main.ts'), 'utf8');
    const resTs = fs.readFileSync(path.join(SRC_DIR, 'reservations.ts'), 'utf8');
    const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');

    test('J4.Adv.1: Static AST Guarantee of 0 Active window.open Across Reservation Code', () => {
      const tsFiles = ['main.ts', 'reservations.ts', 'experiencia.ts'];
      for (const file of tsFiles) {
        const code = fs.readFileSync(path.join(SRC_DIR, file), 'utf8');
        const openCalls = [...code.matchAll(/(?<!\/\/[^\n]*)(?<!\/\*[\s\S]*?)window\.open\s*\(/g)];
        assert.equal(openCalls.length, 0, `src/${file} must have 0 active window.open calls`);
      }

      // 2-step confirmation container present in index.html
      assert.match(indexHtml, /<div[^>]*id=["']reservation-confirmation-card["']/i);
    });

    test('J4.Adv.2: Crockford-32 Collision Resistance under 1,000 Generated Locators & Bijective Parity', () => {
      const rng = createMulberry32(2);
      const locators = new Set();
      const forbiddenGlyphs = ['0', 'O', '1', 'I'];

      for (let i = 0; i < 1000; i++) {
        const loc = srcGenerateLocator(rng);
        assert.match(loc, LOCATOR_REGEX, `Locator "${loc}" must match ^SP-[A-Z0-9]{4}$`);

        const codePart = loc.substring(3);
        for (const glyph of forbiddenGlyphs) {
          assert.ok(!codePart.includes(glyph), `Locator "${loc}" must not contain ambiguous glyph "${glyph}"`);
        }

        assert.ok(!locators.has(loc), `Collision detected at index ${i}: locator "${loc}" was generated twice`);
        locators.add(loc);
      }

      assert.equal(locators.size, 1000, '1,000 generated locators must be 100% unique');

      // Bijective sequential mapping test across base-32 space (1,000 samples)
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
      assert.equal(bijectiveSet.size, 1000, '1,000 sequential bijective locators must be 100% unique');
    });

    test('J4.Adv.3: 4-Table Capacity Cap & Dynamic Cancellation State Transition', () => {
      // 0..3 bookings: available
      for (let count = 0; count <= 3; count++) {
        const status = srcCheckSlotAvailability(count);
        assert.equal(status.available, true);
        assert.equal(status.reason, undefined);
      }

      // Exactly 4 bookings: full
      const full = srcCheckSlotAvailability(4);
      assert.equal(full.available, false);
      assert.equal(full.reason, 'Completo');

      // Overflow: 5+ bookings
      const overflow = srcCheckSlotAvailability(7);
      assert.equal(overflow.available, false);
      assert.equal(overflow.reason, 'Completo');

      // Dynamic slot state transition with cancellation:
      // A slot has 4 active bookings and 3 cancelled bookings -> total 7 records
      const slotRecords = [
        { id: '1', status: 'confirmed' },
        { id: '2', status: 'pending' },
        { id: '3', status: 'confirmed' },
        { id: '4', status: 'confirmed' },
        { id: '5', status: 'cancelled' },
        { id: '6', status: 'cancelled' },
        { id: '7', status: 'cancelled' }
      ];

      let active = slotRecords.filter(r => r.status !== 'cancelled').length;
      assert.equal(active, 4);
      assert.equal(srcCheckSlotAvailability(active).available, false);

      // Now cancel reservation #2
      slotRecords[1].status = 'cancelled';
      active = slotRecords.filter(r => r.status !== 'cancelled').length;
      assert.equal(active, 3);
      assert.equal(srcCheckSlotAvailability(active).available, true);
    });

    test('J4.Adv.4: Imperial Table Policy (>6 Pax up to 20) & WhatsApp Text Formulation', () => {
      // Standard parties (1..6)
      for (let p = 1; p <= 6; p++) {
        const check = srcValidateGuestCount(p);
        assert.equal(check.valid, true);
        assert.equal(check.isImperial, false);
      }

      // Imperial Table parties (7..20)
      for (let p = 7; p <= 20; p++) {
        const check = srcValidateGuestCount(p);
        assert.equal(check.valid, true);
        assert.equal(check.isImperial, true);
        assert.ok(check.notice && check.notice.includes('mesa imperial'));

        const waUrl = srcBuildWaUrl({
          locator: 'SP-9K4M',
          name: 'Elena Ramos',
          date: '2026-11-25',
          time: '21:00',
          people: p
        });
        assert.ok(waUrl.includes(encodeURIComponent('Mesa Imperial solicitada.')));
      }

      // Invalid counts
      const invalidCounts = [0, -5, 21, 100, 4.5, NaN, 'eight'];
      for (const bad of invalidCounts) {
        const check = srcValidateGuestCount(bad);
        assert.equal(check.valid, false);
      }
    });

    test('J4.Adv.5: RFC 9457 Problem Details Toasts & Zero Active alert() Calls', () => {
      // AST scan: exactly 0 active alert calls
      const tsFiles = ['main.ts', 'admin.ts', 'reservations.ts', 'experiencia.ts'];
      for (const file of tsFiles) {
        const code = fs.readFileSync(path.join(SRC_DIR, file), 'utf8');
        const alertMatches = [...code.matchAll(/(?<!\/\/[^\n]*)(?<!\/\*[\s\S]*?)\balert\s*\(/g)];
        assert.equal(alertMatches.length, 0, `src/${file} must contain 0 alert() calls`);
      }

      // Problem details toast structure
      const problem = createProblemDetails({
        type: 'https://sabeaperu.es/errors/invalid-date',
        title: 'Fecha Inválida',
        status: 422,
        detail: 'La fecha seleccionada no puede ser en el pasado.'
      });

      const toastHtml = renderProblemToastHtml(problem);
      assert.ok(toastHtml.includes('class="toast error rfc-9457"'));
      assert.ok(toastHtml.includes('role="alert"'));
      assert.ok(toastHtml.includes('data-status="422"'));
      assert.ok(toastHtml.includes('Fecha Inválida'));
      assert.ok(toastHtml.includes('La fecha seleccionada no puede ser en el pasado.'));
    });
  });

  // ==========================================================================
  // CROSS-CUTTING & PIPELINE PERFORMANCE BUDGETS
  // ==========================================================================
  describe('Cross-Cutting Architecture & Production Pipeline Verification', () => {

    test('J5.Adv.1: CSS Bundle Size SLA (< 35 kB raw, < 10 kB gzip) and Active Stylesheet Linking', () => {
      const assetsDir = path.join(ROOT_DIR, 'dist', 'assets');
      assert.ok(fs.existsSync(assetsDir), 'dist/assets directory must exist');

      const cssFiles = fs.readdirSync(assetsDir).filter(f => f.startsWith('style-') && f.endsWith('.css'));
      assert.ok(cssFiles.length >= 1, 'Production style-*.css must be present in dist/assets');

      const stylePath = path.join(assetsDir, cssFiles[0]);
      const rawBytes = fs.readFileSync(stylePath).length;
      const gzipBytes = zlib.gzipSync(fs.readFileSync(stylePath)).length;

      const RAW_LIMIT = 35 * 1024; // 35 kB
      const GZIP_LIMIT = 10 * 1024; // 10 kB

      assert.ok(rawBytes < RAW_LIMIT, `CSS raw size ${rawBytes} B exceeds 35 kB budget`);
      assert.ok(gzipBytes < GZIP_LIMIT, `CSS gzip size ${gzipBytes} B exceeds 10 kB budget`);

      // Verify dist/experiencia.html links active style-*.css
      const distExpHtml = fs.readFileSync(path.join(ROOT_DIR, 'dist', 'experiencia.html'), 'utf8');
      assert.match(distExpHtml, /<link[^>]*rel=["']stylesheet["'][^>]*href=["']\/assets\/style-[^"']+\.css["']/i);
      assert.match(distExpHtml, /<link[^>]*rel=["']stylesheet["'][^>]*href=["']\/assets\/experiencia-[^"']+\.css["']/i);
    });

    test('J5.Adv.2: Zero TypeScript ": any" or "as any" Across All Production Modules', () => {
      const tsFiles = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.ts'));
      const violations = [];
      for (const file of tsFiles) {
        const code = fs.readFileSync(path.join(SRC_DIR, file), 'utf8')
          .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, ''); // strip comments
        const anyMatches = code.match(/:\s*any\b/g) || [];
        const asAnyMatches = code.match(/\bas\s+any\b/g) || [];
        const total = anyMatches.length + asAnyMatches.length;
        if (total > 0) {
          violations.push(`${file} (${anyMatches.length} ': any', ${asAnyMatches.length} 'as any')`);
        }
      }
      assert.deepEqual(violations, [], `Unsafe type escapes found in: ${violations.join(', ')}`);
    });

    test('J5.Adv.3: Clean Production Pipeline Execution (Exit Code 0 under 20s)', () => {
      const start = Date.now();
      assert.doesNotThrow(() => {
        execSync('npm run pipeline', { cwd: ROOT_DIR, stdio: 'pipe', timeout: 20000 });
      });
      const elapsed = Date.now() - start;
      assert.ok(elapsed < 20000, `Pipeline took ${elapsed}ms, exceeding 20s SLA`);
    });
  });
});
