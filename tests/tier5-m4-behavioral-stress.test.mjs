/**
 * Tier 5: Adversarial Challenger Stress Suite (Milestone 4 - Backoffice DOM & Behavioral Stress)
 * Formal SSOT: specs/admin-spec.md, specs/openapi.yaml, specs/SDD_MASTER.md [DT-03], [DT-04], [DT-05], [DT-10], [DT-11], [DT-12]
 * Agent: m4_challenger_2 (EMPIRICAL CHALLENGER - Backoffice DOM & Behavioral Stress Testing)
 * 
 * Conducts empirical behavioral stress testing on Milestone 4 Backoffice:
 * 1. Allergen Chip Stress:
 *    - Chip toggle behavior: clicking toggles .active, parity under rapid alternations.
 *    - Form population on dish editing: ['pescado', 'picante'] activates only those 2 chips.
 *    - Submission extraction: getSelectedAllergenTags reads exact active array, ignores adversarial tags.
 *    - Cancel/reset: modal dismissal & resetAllergenChips clear all .active chips.
 * 2. File Upload & Preview Validation Stress:
 *    - Boundary condition: 10 MB exact passes, 10 MB + 1 byte rejected with toast and input cleared.
 *    - MIME validation: PDF, GIF, TXT, SVG rejected; JPEG, PNG, WebP accepted.
 *    - Preview container ID conformance (T1.4.3: #preview-item-image and #preview-gallery-image).
 * 3. Reservations Operational Hub Stress:
 *    - Tab filtering: pending, today (YYYY-MM-DD), all, and dual key support.
 *    - Button action wiring: .btn-confirm-res, .btn-cancel-res confirmation prompt, .btn-wa-client phone sanitization & encoding.
 * 4. Production Code Hygiene & Cloudinary Invariants:
 *    - Zero firebase/storage imports, zero : any, zero alert() calls, normalizeCloudinaryUrl idempotency.
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { MockElement, MockDocument } from './helpers/mock-dom.mjs';
import { normalizeCloudinaryUrl } from './contracts/cloudinary.mjs';
import { OFFICIAL_ALLERGEN_TAGS } from './contracts/allergens.mjs';
import { createProblemDetails } from './contracts/errors.mjs';

const ROOT_DIR = process.cwd();

// ============================================================================
// DOM HARNESS HELPERS (Mirroring src/admin.ts implementation contracts)
// ============================================================================

function setupAllergenChipsHarness() {
  const doc = new MockDocument();
  const container = doc.createElement('div');
  container.id = 'allergen-chips-container';
  container.className = 'allergen-chips-grid';
  doc.body.appendChild(container);

  // Hydrate the 16 chips conforming to admin.html and src/admin.ts
  OFFICIAL_ALLERGEN_TAGS.forEach(tag => {
    const btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'tag-chip';
    btn.setAttribute('data-tag', tag);
    btn.textContent = tag.toUpperCase();

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      btn.classList.toggle('active');
    });

    container.appendChild(btn);
  });

  function resetAllergenChips() {
    const chips = container.querySelectorAll('.tag-chip');
    chips.forEach(chip => chip.classList.remove('active'));
  }

  function populateAllergenChips(tags = []) {
    resetAllergenChips();
    const tagList = Array.isArray(tags)
      ? tags
      : typeof tags === 'string'
        ? tags.split(',').map(t => t.trim().toLowerCase())
        : [];

    tagList.forEach(rawTag => {
      const cleanTag = String(rawTag).toLowerCase();
      const chip = container.querySelector(`[data-tag="${cleanTag}"]`);
      if (chip) {
        chip.classList.add('active');
      }
    });
  }

  function getSelectedAllergenTags() {
    const allChips = container.querySelectorAll('.tag-chip');
    const activeChips = allChips.filter(c => c.classList.contains('active'));
    return activeChips
      .map(chip => chip.getAttribute('data-tag'))
      .filter(t => OFFICIAL_ALLERGEN_TAGS.includes(t));
  }

  return {
    doc,
    container,
    resetAllergenChips,
    populateAllergenChips,
    getSelectedAllergenTags
  };
}

function validateUploadFile(file) {
  const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
  const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

  if (!file) {
    return { valid: false, error: 'No se ha seleccionado ningún archivo.' };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { valid: false, error: 'El archivo excede el límite máximo de 10 MB.' };
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return { valid: false, error: 'Formato no permitido. Solo JPEG, PNG o WebP.' };
  }

  return { valid: true };
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

describe('Tier 5: Adversarial Challenger Stress Suite (Milestone 4 - Backoffice)', () => {

  // ==========================================================================
  // SECTION 1: ALLERGEN CHIP BEHAVIORAL STRESS
  // ==========================================================================
  describe('Scenario C1: Allergen Chip Behavioral & Interaction Stress', () => {

    test('T5.M4.1: Clicking inactive chip adds .active; clicking active chip removes .active', () => {
      const harness = setupAllergenChipsHarness();
      const chip = harness.container.querySelector('[data-tag="pescado"]');

      assert.equal(chip.classList.contains('active'), false);
      chip.click();
      assert.equal(chip.classList.contains('active'), true);
      assert.deepEqual(harness.getSelectedAllergenTags(), ['pescado']);

      chip.click();
      assert.equal(chip.classList.contains('active'), false);
      assert.deepEqual(harness.getSelectedAllergenTags(), []);
    });

    test('T5.M4.2: Rapid alternating clicks (101 clicks) maintains accurate parity state without leak', () => {
      const harness = setupAllergenChipsHarness();
      const chip = harness.container.querySelector('[data-tag="picante"]');

      for (let i = 0; i < 101; i++) {
        chip.click();
      }
      // 101 clicks on initially false -> odd number -> should be active
      assert.equal(chip.classList.contains('active'), true);
      assert.deepEqual(harness.getSelectedAllergenTags(), ['picante']);

      chip.click(); // 102nd click -> even -> should be false
      assert.equal(chip.classList.contains('active'), false);
      assert.deepEqual(harness.getSelectedAllergenTags(), []);
    });

    test('T5.M4.3: Form population in dish editing with tags: ["pescado", "picante"] sets .active on ONLY those two chips', () => {
      const harness = setupAllergenChipsHarness();

      harness.populateAllergenChips(['pescado', 'picante']);

      const allChips = harness.container.querySelectorAll('.tag-chip');
      const activeChips = allChips.filter(c => c.classList.contains('active'));
      assert.equal(activeChips.length, 2, 'Exactly 2 chips must be active');

      const activeTags = activeChips.map(c => c.getAttribute('data-tag'));
      assert.deepEqual(activeTags, ['pescado', 'picante']);

      // Assert that all 14 other chips are strictly NOT active
      const inactiveChips = allChips.filter(c => !c.classList.contains('active'));
      assert.equal(inactiveChips.length, 14, 'Remaining 14 chips must be inactive');
      const inactiveTags = inactiveChips.map(c => c.getAttribute('data-tag'));
      assert.ok(!inactiveTags.includes('pescado'));
      assert.ok(!inactiveTags.includes('picante'));
    });

    test('T5.M4.4: Form population handles case-insensitivity, dirty whitespace strings, and duplicates', () => {
      const harness = setupAllergenChipsHarness();

      // Dirty input: uppercase, extra whitespace, duplicate tags
      harness.populateAllergenChips('  PESCADO  ,  picante , pescado, HUEVOS ');

      const selected = harness.getSelectedAllergenTags();
      assert.deepEqual(selected, ['pescado', 'picante', 'huevos']);

      const allChips = harness.container.querySelectorAll('.tag-chip');
      const activeCount = allChips.filter(c => c.classList.contains('active')).length;
      assert.equal(activeCount, 3, 'Duplicate tags must not produce duplicate active states');
    });

    test('T5.M4.5: Form population with invalid or malicious tags ignores unknown keys without crashing', () => {
      const harness = setupAllergenChipsHarness();

      assert.doesNotThrow(() => {
        harness.populateAllergenChips(['<script>alert(1)</script>', 'peanuts_unauthorized', '', null, undefined, 'crustaceos']);
      });

      const selected = harness.getSelectedAllergenTags();
      assert.deepEqual(selected, ['crustaceos'], 'Only authorized tags from OFFICIAL_ALLERGEN_TAGS can be activated');
    });

    test('T5.M4.6: Submission extraction filters out any unauthorized adversarial DOM elements injected into container', () => {
      const harness = setupAllergenChipsHarness();

      // Normal user clicks
      harness.container.querySelector('[data-tag="carne"]').click();
      harness.container.querySelector('[data-tag="soja"]').click();

      // Adversarial injection of a fake active chip
      const rogueChip = harness.doc.createElement('button');
      rogueChip.className = 'tag-chip active';
      rogueChip.setAttribute('data-tag', 'poison_tag_injection');
      harness.container.appendChild(rogueChip);

      const extracted = harness.getSelectedAllergenTags();
      assert.deepEqual(extracted, ['carne', 'soja'], 'Rogue tag must be stripped out by OFFICIAL_ALLERGEN_TAGS filter');
    });

    test('T5.M4.7: Modal cancel/reset (resetAllergenChips) clears all .active chips immediately', () => {
      const harness = setupAllergenChipsHarness();

      // Activate all 16 chips
      harness.populateAllergenChips([...OFFICIAL_ALLERGEN_TAGS]);
      assert.equal(harness.getSelectedAllergenTags().length, 16);

      // Trigger reset
      harness.resetAllergenChips();

      assert.equal(harness.getSelectedAllergenTags().length, 0);
      const allChips = harness.container.querySelectorAll('.tag-chip');
      const remainingActive = allChips.filter(c => c.classList.contains('active'));
      assert.equal(remainingActive.length, 0, 'No chip should retain the active class');
    });
  });

  // ==========================================================================
  // SECTION 2: FILE UPLOAD & PREVIEW VALIDATION STRESS
  // ==========================================================================
  describe('Scenario C2: File Upload & Live Preview Boundary Stress', () => {

    test('T5.M4.8: File size boundary: exactly 10 MB (10485760 B) is ACCEPTED', () => {
      const exactTenMbFile = {
        name: 'plato-perfecto.jpg',
        size: 10 * 1024 * 1024,
        type: 'image/jpeg'
      };
      const result = validateUploadFile(exactTenMbFile);
      assert.equal(result.valid, true);
      assert.equal(result.error, undefined);
    });

    test('T5.M4.9: File size boundary: 10 MB + 1 byte (10485761 B) is strictly REJECTED', () => {
      const oversizeFile = {
        name: 'plato-pesado.png',
        size: (10 * 1024 * 1024) + 1,
        type: 'image/png'
      };
      const result = validateUploadFile(oversizeFile);
      assert.equal(result.valid, false);
      assert.ok(result.error.includes('10 MB'), 'Error detail must cite 10 MB limit');
    });

    test('T5.M4.10: Massive file sizes (100 MB, 1 GB) and zero/null files are safely rejected', () => {
      const massiveFile = { name: 'huge.jpg', size: 100 * 1024 * 1024, type: 'image/jpeg' };
      assert.equal(validateUploadFile(massiveFile).valid, false);

      assert.equal(validateUploadFile(null).valid, false);
      assert.equal(validateUploadFile(undefined).valid, false);
    });

    test('T5.M4.11: MIME validation strictly accepts only JPEG, PNG, and WebP', () => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      for (const mime of validTypes) {
        const file = { name: `test.${mime.split('/')[1]}`, size: 500000, type: mime };
        assert.equal(validateUploadFile(file).valid, true, `MIME ${mime} must be valid`);
      }
    });

    test('T5.M4.12: MIME validation rejects unsupported formats (PDF, GIF, TXT, SVG, executables)', () => {
      const forbiddenMimes = [
        'application/pdf',
        'image/gif',
        'text/plain',
        'image/svg+xml',
        'application/x-msdownload',
        'image/bmp',
        ''
      ];

      for (const mime of forbiddenMimes) {
        const file = { name: 'sample', size: 500000, type: mime };
        const result = validateUploadFile(file);
        assert.equal(result.valid, false, `MIME ${mime} must be rejected`);
        assert.ok(result.error.includes('Formato no permitido'));
      }
    });

    test('T5.M4.13: File input change handler clears input value and emits RFC 9457 error toast on invalid file', () => {
      const doc = new MockDocument();
      const fileInput = doc.createElement('input');
      fileInput.type = 'file';
      fileInput.value = 'C:\\fakepath\\document.pdf';

      const previewBox = doc.createElement('div');
      previewBox.id = 'dish-preview-container';
      previewBox.style.display = 'none';

      let problemToastEmitted = null;

      // Simulated controller logic from src/admin.ts:607-621
      function handleFileChange(selectedFile) {
        const validation = validateUploadFile(selectedFile);
        if (!validation.valid) {
          problemToastEmitted = createProblemDetails({
            type: 'https://api.sabeaperu.es/errors/invalid-file',
            title: 'Archivo no permitido',
            status: 400,
            detail: validation.error
          });
          fileInput.value = '';
          return;
        }
        previewBox.style.display = 'block';
      }

      handleFileChange({ name: 'document.pdf', size: 1024, type: 'application/pdf' });

      // Verification of side-effects
      assert.equal(fileInput.value, '', 'file input value must be cleared upon validation failure');
      assert.equal(previewBox.style.display, 'none', 'preview must remain hidden');
      assert.ok(problemToastEmitted, 'Problem toast must be emitted');
      assert.equal(problemToastEmitted.status, 400);
      assert.ok(problemToastEmitted.detail.includes('Formato no permitido'));
    });

    test('T5.M4.14: Preview container ID conformance adheres strictly to T1.4.3 in admin.html', () => {
      const adminHtml = fs.readFileSync(path.join(ROOT_DIR, 'admin.html'), 'utf8');

      // T1.4.3 exact IDs: preview-item-image and preview-gallery-image
      assert.match(adminHtml, /id="preview-item-image"/, 'admin.html must contain #preview-item-image');
      assert.match(adminHtml, /id="preview-gallery-image"/, 'admin.html must contain #preview-gallery-image');

      // Wrapper containers
      assert.match(adminHtml, /id="dish-preview-container"/, 'admin.html must contain #dish-preview-container');
      assert.match(adminHtml, /id="gallery-preview-container"/, 'admin.html must contain #gallery-preview-container');

      // Both M4 preview image tags must have alt attributes
      const dishImgMatch = adminHtml.match(/<img[^>]*id="preview-item-image"[^>]*>/i);
      assert.ok(dishImgMatch, 'preview-item-image img tag must exist');
      assert.match(dishImgMatch[0], /\balt=["'][^"']+["']/i, 'preview-item-image must have non-empty alt');

      const galleryImgMatch = adminHtml.match(/<img[^>]*id="preview-gallery-image"[^>]*>/i);
      assert.ok(galleryImgMatch, 'preview-gallery-image img tag must exist');
      assert.match(galleryImgMatch[0], /\balt=["'][^"']+["']/i, 'preview-gallery-image must have non-empty alt');

      // Invariant T1.4.3: Every img tag in admin.html must have an id starting with preview-
      const imgTags = [...adminHtml.matchAll(/<img\b([^>]*)>/gi)].map(m => m[1]);
      assert.ok(imgTags.length > 0, 'admin.html must have img preview tags');
      for (const attrs of imgTags) {
        assert.match(attrs, /\bid=["']preview-[^"']+["']/i,
          `Every img in admin.html must have id="preview-...". Found: <img ${attrs}>`);
      }
    });
  });

  // ==========================================================================
  // SECTION 3: RESERVATIONS OPERATIONAL HUB STRESS
  // ==========================================================================
  describe('Scenario C3: Reservations Hub Filtering & Operational Actions Stress', () => {

    const todayIso = new Date().toISOString().split('T')[0];

    const sampleReservations = [
      {
        id: 'res_1',
        name: 'Elena Ramos',
        phone: '+34 611 22 33 44',
        date: todayIso,
        time: '14:00',
        people: 2,
        status: 'pending',
        locator: 'SP-1111'
      },
      {
        id: 'res_2',
        customer_name: 'Carlos Mendoza',
        customer_phone: '34655443322',
        reservation_date: todayIso,
        reservation_time: '14:30',
        number_of_people: 4,
        status: 'confirmed',
        locator: 'SP-2222'
      },
      {
        id: 'res_3',
        name: 'Valeria Castro',
        phone: '0034-677-88-99-00',
        date: '2026-12-31',
        time: '21:00',
        people: 6,
        status: 'pending',
        locator: 'SP-3333'
      },
      {
        id: 'res_4',
        name: 'Jorge Benavides',
        phone: '34699001122',
        date: '2026-01-01',
        time: '15:00',
        people: 2,
        status: 'cancelled',
        locator: 'SP-4444'
      },
      {
        id: 'res_5_legacy',
        name: 'Cliente Antiguo Sin Estado',
        phone: '612345678',
        date: todayIso,
        time: '20:30',
        people: 3,
        // status is undefined -> defaults to pending
        locator: 'SP-5555'
      }
    ];

    function filterReservations(items, tab) {
      return items.filter(res => {
        const resDate = res.reservation_date || res.date || '';
        const resStatus = res.status || 'pending';
        if (tab === 'pending') {
          return resStatus === 'pending';
        }
        if (tab === 'today') {
          return resDate === todayIso;
        }
        return true;
      });
    }

    test('T5.M4.15: Tab filter "pending" returns only pending reservations (including legacy records defaulting to pending)', () => {
      const pendingList = filterReservations(sampleReservations, 'pending');
      assert.equal(pendingList.length, 3);
      const ids = pendingList.map(r => r.id);
      assert.ok(ids.includes('res_1'));
      assert.ok(ids.includes('res_3'));
      assert.ok(ids.includes('res_5_legacy'));
      assert.ok(!ids.includes('res_2')); // confirmed
      assert.ok(!ids.includes('res_4')); // cancelled
    });

    test('T5.M4.16: Tab filter "today" returns all reservations scheduled for today regardless of status', () => {
      const todayList = filterReservations(sampleReservations, 'today');
      assert.equal(todayList.length, 3);
      const ids = todayList.map(r => r.id);
      assert.ok(ids.includes('res_1'));        // pending today
      assert.ok(ids.includes('res_2'));        // confirmed today
      assert.ok(ids.includes('res_5_legacy')); // legacy today
      assert.ok(!ids.includes('res_3'));       // 2026-12-31
      assert.ok(!ids.includes('res_4'));       // 2026-01-01
    });

    test('T5.M4.17: Tab filter "all" returns the complete historical reservation list', () => {
      const allList = filterReservations(sampleReservations, 'all');
      assert.equal(allList.length, 5);
    });

    test('T5.M4.18: Button action wiring: .btn-confirm-res triggers confirmed mutation and disables button', () => {
      const doc = new MockDocument();
      let mutatedStatus = null;
      let mutatedId = null;

      const fakeDbUpdate = (id, payload) => {
        mutatedId = id;
        mutatedStatus = payload.status;
      };

      const btn = doc.createElement('button');
      btn.className = 'btn-confirm-res';
      btn.setAttribute('data-id', 'res_1');

      btn.addEventListener('click', () => {
        fakeDbUpdate(btn.getAttribute('data-id'), { status: 'confirmed' });
        btn.disabled = true;
      });

      btn.click();
      assert.equal(mutatedId, 'res_1');
      assert.equal(mutatedStatus, 'confirmed');
      assert.equal(btn.disabled, true);
    });

    test('T5.M4.19: Button action wiring: .btn-cancel-res prompts confirmation; aborts if cancelled, mutates if accepted', () => {
      let confirmPromptMessage = null;
      let mockConfirmAnswer = false;

      const fakeConfirm = (msg) => {
        confirmPromptMessage = msg;
        return mockConfirmAnswer;
      };

      let mutatedStatus = null;
      const fakeDbUpdate = (id, payload) => {
        mutatedStatus = payload.status;
      };

      function handleCancelClick(id) {
        if (fakeConfirm('¿Desea cancelar esta reserva y liberar el cupo?')) {
          fakeDbUpdate(id, { status: 'cancelled' });
        }
      }

      // 1. User dismisses confirmation prompt
      mockConfirmAnswer = false;
      handleCancelClick('res_2');
      assert.equal(confirmPromptMessage, '¿Desea cancelar esta reserva y liberar el cupo?');
      assert.equal(mutatedStatus, null, 'Mutation must not occur when user dismisses confirmation dialog');

      // 2. User confirms cancellation
      mockConfirmAnswer = true;
      handleCancelClick('res_2');
      assert.equal(mutatedStatus, 'cancelled', 'Mutation must occur when user confirms cancellation');
    });

    test('T5.M4.20: WhatsApp button encodes URL, cleans phone (digits only), and escapes quotes against attribute injection', () => {
      const maliciousReservation = {
        id: 'res_xss',
        customer_name: 'Daniel "><script>alert(1)</script>',
        customer_phone: '+34 (654) 72-87-87 ext 9',
        locator: 'SP-XSS9'
      };

      const rawPhone = maliciousReservation.customer_phone;
      const cleanPhone = rawPhone.replace(/\D/g, '') || '34662125650';
      assert.equal(cleanPhone, '346547287879');

      const clientName = maliciousReservation.customer_name;
      const locator = maliciousReservation.locator;
      const msg = `Hola ${clientName}, le escribimos de Sabe a Perú respecto a su reserva ${locator}.`;
      const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;

      // Verification: URL encoding protects entire message string
      assert.ok(waLink.startsWith('https://wa.me/346547287879?text='));
      assert.ok(!waLink.includes(' '));
      assert.ok(!waLink.includes('<script>'));
      assert.ok(waLink.includes(encodeURIComponent('Daniel "><script>alert(1)</script>')));
      assert.ok(waLink.includes(encodeURIComponent('SP-XSS9')));

      // Verification: HTML attribute escaping prevents double quote breakouts
      const htmlRow = `<a class="btn-wa-client" href="${waLink}" target="_blank" rel="noopener" data-name="${escapeHtml(clientName)}">WhatsApp</a>`;
      assert.ok(!htmlRow.includes('"><script>'));
      assert.ok(htmlRow.includes('&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;'));
    });
  });

  // ==========================================================================
  // SECTION 4: PRODUCTION SOURCE HYGIENE & CLOUDINARY NORMALIZATION
  // ==========================================================================
  describe('Scenario C4: Production Source Hygiene & Cloudinary Normalization', () => {

    test('T5.M4.21: src/admin.ts and src/main.ts contain ZERO imports of firebase/storage', () => {
      const adminCode = fs.readFileSync(path.join(ROOT_DIR, 'src', 'admin.ts'), 'utf8');
      const mainCode = fs.readFileSync(path.join(ROOT_DIR, 'src', 'main.ts'), 'utf8');

      assert.doesNotMatch(adminCode, /from\s+['"]firebase\/storage['"]/i,
        'src/admin.ts must have zero imports from firebase/storage');
      assert.doesNotMatch(adminCode, /getStorage\(/i,
        'src/admin.ts must have zero calls to getStorage');
      assert.doesNotMatch(mainCode, /from\s+['"]firebase\/storage['"]/i,
        'src/main.ts must have zero imports from firebase/storage');
      assert.doesNotMatch(mainCode, /getStorage\(/i,
        'src/main.ts must have zero calls to getStorage');
    });

    test('T5.M4.22: src/admin.ts contains ZERO occurrences of TypeScript : any', () => {
      const adminCode = fs.readFileSync(path.join(ROOT_DIR, 'src', 'admin.ts'), 'utf8');
      const anyMatches = adminCode.match(/:\s*any\b/g);
      assert.equal(anyMatches, null, `src/admin.ts must contain zero : any types. Found: ${anyMatches?.length}`);
    });

    test('T5.M4.23: src/admin.ts contains ZERO native alert() executable calls (RFC 9457 toasts enforced)', () => {
      const adminCode = fs.readFileSync(path.join(ROOT_DIR, 'src', 'admin.ts'), 'utf8');
      // Strip comments to inspect actual executable code only
      const strippedCode = adminCode.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
      const alertMatches = strippedCode.match(/\balert\s*\(/g);
      assert.equal(alertMatches, null, 'src/admin.ts must not call native alert()');
    });

    test('T5.M4.24: normalizeCloudinaryUrl pure algorithm satisfies idempotency and parameter stripping', () => {
      const dirtyUrl = 'https://res.cloudinary.com/dhvbqs2ba/image/upload/v1720000000/ceviche.jpg?v=1720000000';
      const normalized1 = normalizeCloudinaryUrl(dirtyUrl, 800);
      assert.equal(
        normalized1,
        'https://res.cloudinary.com/dhvbqs2ba/image/upload/f_auto,q_auto,w_800,c_limit/v1720000000/ceviche.jpg'
      );

      // Idempotency check: normalizing an already normalized URL must not duplicate flags
      const normalized2 = normalizeCloudinaryUrl(normalized1, 800);
      assert.equal(normalized2, normalized1, 'normalizeCloudinaryUrl must be idempotent');

      // Non-Cloudinary or falsy pass-through
      assert.equal(normalizeCloudinaryUrl('/assets/hero.webp'), '/assets/hero.webp');
      assert.equal(normalizeCloudinaryUrl(null), '');
      assert.equal(normalizeCloudinaryUrl(''), '');
    });

    test('T5.M4.25: src/style.css defines Quiet Luxury tokens for chips, status badges, and tabs', () => {
      const css = fs.readFileSync(path.join(ROOT_DIR, 'src', 'style.css'), 'utf8');
      assert.ok(css.includes('.tag-chip'), 'style.css must define .tag-chip');
      assert.ok(css.includes('.tag-chip.active'), 'style.css must define .tag-chip.active');
      assert.ok(css.includes('.reservation-filter-tabs'), 'style.css must define .reservation-filter-tabs');
      assert.ok(css.includes('.res-status-badge.status-pending'), 'style.css must define status-pending');
      assert.ok(css.includes('.res-status-badge.status-confirmed'), 'style.css must define status-confirmed');
      assert.ok(css.includes('.res-status-badge.status-cancelled'), 'style.css must define status-cancelled');
      assert.ok(css.includes('.btn-wa-client'), 'style.css must define .btn-wa-client');
      assert.ok(css.includes('.image-preview-wrapper'), 'style.css must define .image-preview-wrapper');
    });
  });
});
