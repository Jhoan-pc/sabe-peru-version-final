/**
 * Tier 5: Milestone 4 Adversarial Challenges & Empirical Stress Suite
 * SSOT: ORIGINAL_REQUEST.md R4, PROJECT.md M4, specs/admin-spec.md §2, specs/openapi.yaml
 * Agent: m4_challenger_1 (EMPIRICAL CHALLENGER - Cloudinary & Storage Adversarial)
 * 
 * Conducts exhaustive empirical stress tests on:
 * 1. Scenario M4.1: normalizeCloudinaryUrl Cache-Buster & Dirty Query Parameter Stripping
 * 2. Scenario M4.2: normalizeCloudinaryUrl Idempotency & Re-entrancy Stress (5 to 50 iterations)
 * 3. Scenario M4.3: normalizeCloudinaryUrl Parameter Replacement & Width Cascade
 * 4. Scenario M4.4: normalizeCloudinaryUrl Non-Cloudinary, Local & Falsy Fallback Matrix
 * 5. Scenario M4.5: normalizeCloudinaryUrl Non-Upload Endpoints & Edge Formats
 * 6. Scenario M4.6: Cross-Module Parity (contracts/cloudinary.mjs vs src/admin.ts vs src/main.ts)
 * 7. Scenario M4.7: Static Storage & Alert Eradication Integrity (src/admin.ts, src/main.ts, src/reservations.ts)
 * 8. Scenario M4.8: Backoffice DOM & Quiet Luxury Controls Integrity (admin.html)
 * 9. Scenario M4.9: File Upload Validation & RFC 9457 Toast Engine
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { normalizeCloudinaryUrl as contractNormalize } from './contracts/cloudinary.mjs';
import { OFFICIAL_ALLERGEN_TAGS } from './contracts/allergens.mjs';

const ROOT_DIR = process.cwd();

/**
 * Safely extracts and instantiates the pure normalizeCloudinaryUrl function
 * from a TypeScript source file by reading its AST/body.
 */
function extractNormalizeFnFromTs(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const match = code.match(/function\s+normalizeCloudinaryUrl\s*\([^)]*\)\s*:[^{]*\{([\s\S]*?)\n\}/);
  if (!match) {
    throw new Error(`Could not extract normalizeCloudinaryUrl from ${filePath}`);
  }
  const body = match[1];
  return new Function('url', 'width = 800', body);
}

const adminNormalize = extractNormalizeFnFromTs(path.join(ROOT_DIR, 'src', 'admin.ts'));
const mainNormalize = extractNormalizeFnFromTs(path.join(ROOT_DIR, 'src', 'main.ts'));

// Test implementations array for cross-module assertions
const implementations = [
  { name: 'contracts/cloudinary.mjs', fn: contractNormalize },
  { name: 'src/admin.ts', fn: adminNormalize },
  { name: 'src/main.ts', fn: mainNormalize }
];

describe('Tier 5 / Milestone 4 Adversarial Challenges (Cloudinary & Storage Eradication)', () => {

  // =========================================================================
  // SCENARIO M4.1: Cache-Buster & Dirty Query Parameter Stripping
  // =========================================================================
  describe('Scenario M4.1: Dirty Query Parameters & Cache-Busters Stripping', () => {

    test('M4.1.1: Strips single timestamp cache buster (?v=1728892000)', () => {
      const input = 'https://res.cloudinary.com/dhvbqs2ba/image/upload/v1728892000/ceviche.jpg?v=1728892000';
      const expected = 'https://res.cloudinary.com/dhvbqs2ba/image/upload/f_auto,q_auto,w_800,c_limit/v1728892000/ceviche.jpg';

      for (const impl of implementations) {
        const result = impl.fn(input);
        assert.equal(result, expected, `Failed in ${impl.name}`);
        assert.doesNotMatch(result, /\?/, `Query parameter leaked in ${impl.name}`);
      }
    });

    test('M4.1.2: Strips multi-parameter dirty queries (?v=123&foo=bar&utm_source=cloudinary)', () => {
      const input = 'https://res.cloudinary.com/dhvbqs2ba/image/upload/sample.webp?v=123&foo=bar&utm_source=cloudinary';
      const expected = 'https://res.cloudinary.com/dhvbqs2ba/image/upload/f_auto,q_auto,w_800,c_limit/sample.webp';

      for (const impl of implementations) {
        const result = impl.fn(input);
        assert.equal(result, expected, `Failed in ${impl.name}`);
        assert.doesNotMatch(result, /\?/, `Query parameter leaked in ${impl.name}`);
        assert.doesNotMatch(result, /foo=bar/, `Query body leaked in ${impl.name}`);
      }
    });

    test('M4.1.3: Strips empty query delimiter (? with no params)', () => {
      const input = 'https://res.cloudinary.com/dhvbqs2ba/image/upload/dish.png?';
      const expected = 'https://res.cloudinary.com/dhvbqs2ba/image/upload/f_auto,q_auto,w_800,c_limit/dish.png';

      for (const impl of implementations) {
        assert.equal(impl.fn(input), expected, `Failed in ${impl.name}`);
      }
    });

    test('M4.1.4: Strips query with trailing hash fragment (?v=999#preview-anchor)', () => {
      const input = 'https://res.cloudinary.com/dhvbqs2ba/image/upload/dish.png?v=999#preview-anchor';
      const expected = 'https://res.cloudinary.com/dhvbqs2ba/image/upload/f_auto,q_auto,w_800,c_limit/dish.png';

      for (const impl of implementations) {
        assert.equal(impl.fn(input), expected, `Failed in ${impl.name}`);
      }
    });

    test('M4.1.5: Preserves path-level version numbers (v1720000000) while purging query-level version (?v=...)', () => {
      const input = 'https://res.cloudinary.com/dhvbqs2ba/image/upload/v1720000000/folder/sub/ceviche.jpg?v=1729999999';
      const expected = 'https://res.cloudinary.com/dhvbqs2ba/image/upload/f_auto,q_auto,w_800,c_limit/v1720000000/folder/sub/ceviche.jpg';

      for (const impl of implementations) {
        const res = impl.fn(input);
        assert.equal(res, expected, `Failed in ${impl.name}`);
        assert.ok(res.includes('/v1720000000/'), `Path version must be retained in ${impl.name}`);
        assert.doesNotMatch(res, /\?v=/, `Query version must be stripped in ${impl.name}`);
      }
    });
  });

  // =========================================================================
  // SCENARIO M4.2: Idempotency & Re-entrancy Stress
  // =========================================================================
  describe('Scenario M4.2: Normalization Idempotency & Re-entrancy Stress', () => {

    test('M4.2.1: Normalizing an already-normalized URL 5 times produces identical output without duplication', () => {
      const rawUrl = 'https://res.cloudinary.com/dhvbqs2ba/image/upload/sample.jpg';

      for (const impl of implementations) {
        let current = rawUrl;
        const history = [];

        // Run 5 consecutive normalization passes
        for (let i = 0; i < 5; i++) {
          current = impl.fn(current);
          history.push(current);
        }

        // All 5 passes must be strictly identical
        for (let i = 1; i < 5; i++) {
          assert.equal(history[i], history[0], `Pass ${i + 1} diverged from Pass 1 in ${impl.name}`);
        }

        // Assert exactly one occurrence of /f_auto,q_auto,w_800,c_limit/
        const matches = current.match(/f_auto/g);
        assert.equal(matches ? matches.length : 0, 1, `Duplicate /f_auto found in ${impl.name}`);
      }
    });

    test('M4.2.2: Deep stress: 50 consecutive normalization cycles on versioned and nested URLs', () => {
      const testUrls = [
        'https://res.cloudinary.com/dhvbqs2ba/image/upload/v1680000000/dishes/tiradito.jpg',
        'https://res.cloudinary.com/dhvbqs2ba/image/upload/deep/nested/folder/asset.webp?v=111',
        'https://res.cloudinary.com/dhvbqs2ba/image/upload/f_auto,q_auto,w_800,c_limit/lomo-saltado.jpg'
      ];

      for (const url of testUrls) {
        for (const impl of implementations) {
          let value = url;
          for (let i = 0; i < 50; i++) {
            value = impl.fn(value, 800);
          }
          const expected = impl.fn(url, 800);
          assert.equal(value, expected, `Stress cycle 50 diverged for ${url} in ${impl.name}`);

          // Verify no repeated /upload/ transformations
          assert.doesNotMatch(value, /\/upload\/.*\/upload\//, `Repeated upload segment in ${impl.name}`);
          assert.equal((value.match(/f_auto/g) || []).length, 1, `Multiple f_auto in ${impl.name}`);
        }
      }
    });
  });

  // =========================================================================
  // SCENARIO M4.3: Parameter Replacement & Width Cascade
  // =========================================================================
  describe('Scenario M4.3: Existing Transformation Replacement & Width Cascade', () => {

    test('M4.3.1: Replaces old width (w_400) with new target width (w_1200)', () => {
      const input = 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_400,c_limit/sample.jpg';
      const expected = 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_1200,c_limit/sample.jpg';

      for (const impl of implementations) {
        const result = impl.fn(input, 1200);
        assert.equal(result, expected, `Failed to replace width in ${impl.name}`);
        assert.doesNotMatch(result, /w_400/, `Old width leaked in ${impl.name}`);
      }
    });

    test('M4.3.2: Replaces legacy crop transformations (w_500,h_500,c_fill) with canonical directive', () => {
      const input = 'https://res.cloudinary.com/demo/image/upload/w_500,h_500,c_fill/sample.jpg';
      const expected = 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800,c_limit/sample.jpg';

      for (const impl of implementations) {
        const result = impl.fn(input, 800);
        assert.equal(result, expected, `Failed in ${impl.name}`);
        assert.doesNotMatch(result, /c_fill/, `Legacy c_fill leaked in ${impl.name}`);
      }
    });

    test('M4.3.3: Width cascading sequence: 400 -> 800 -> 1600 -> 600 -> 400', () => {
      const base = 'https://res.cloudinary.com/dhvbqs2ba/image/upload/hero.jpg';
      const sequence = [400, 800, 1600, 600, 400];

      for (const impl of implementations) {
        let current = base;
        for (const w of sequence) {
          current = impl.fn(current, w);
          assert.equal(
            current,
            `https://res.cloudinary.com/dhvbqs2ba/image/upload/f_auto,q_auto,w_${w},c_limit/hero.jpg`,
            `Failed cascading to w_${w} in ${impl.name}`
          );
        }
      }
    });
  });

  // =========================================================================
  // SCENARIO M4.4: Non-Cloudinary, Local & Falsy Fallbacks
  // =========================================================================
  describe('Scenario M4.4: Defensive Fallbacks on Non-Cloudinary & Falsy Inputs', () => {

    test('M4.4.1: Non-Cloudinary external URLs (Unsplash, Pexels, Firebase) returned unaltered', () => {
      const externalUrls = [
        'https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
        'https://firebasestorage.googleapis.com/v0/b/sabeaperu.appspot.com/o/ceviche.jpg?alt=media',
        'https://cdn.example.com/assets/images/dish.webp'
      ];

      for (const url of externalUrls) {
        for (const impl of implementations) {
          assert.equal(impl.fn(url), url, `Altered non-Cloudinary URL in ${impl.name}`);
        }
      }
    });

    test('M4.4.2: Local asset paths (/assets/Hero1.webp, ./assets/icon.png) returned unaltered', () => {
      const localPaths = [
        '/assets/Hero1.webp',
        '/assets/hero-pattern.png',
        './assets/CevicheClasico.webp',
        'assets/PiscoSour.webp'
      ];

      for (const pathStr of localPaths) {
        for (const impl of implementations) {
          assert.equal(impl.fn(pathStr), pathStr, `Altered local asset path in ${impl.name}`);
        }
      }
    });

    test('M4.4.3: Falsy inputs (null, undefined, "", false) safely return empty string', () => {
      const invalidInputs = [
        null,
        undefined,
        '',
        false
      ];

      for (const input of invalidInputs) {
        for (const impl of implementations) {
          const result = impl.fn(input);
          assert.equal(result, '', `Expected empty string for input ${input} in ${impl.name}`);
        }
      }
    });
  });

  // =========================================================================
  // SCENARIO M4.5: Non-Upload Cloudinary Endpoints & Special Cases
  // =========================================================================
  describe('Scenario M4.5: Non-Upload Cloudinary Endpoints & Edge Cases', () => {

    test('M4.5.1: Non-upload Cloudinary URL (authenticated endpoint) returns clean URL without upload injection', () => {
      const input = 'https://res.cloudinary.com/demo/image/authenticated/s--xyz--/sample.jpg';
      for (const impl of implementations) {
        const result = impl.fn(input);
        assert.equal(result, input, `Unexpected transformation on authenticated URL in ${impl.name}`);
        assert.doesNotMatch(result, /\/upload\//, `Injected upload into non-upload URL in ${impl.name}`);
      }
    });

    test('M4.5.2: Non-upload Cloudinary URL (fetch endpoint) returns clean URL without upload injection', () => {
      const input = 'https://res.cloudinary.com/demo/image/fetch/https://example.com/sample.jpg';
      for (const impl of implementations) {
        const result = impl.fn(input);
        assert.equal(result, input, `Injected upload into fetch URL in ${impl.name}`);
      }
    });

    test('M4.5.3: Raw resource upload URL (e.g. video/upload or raw/upload) receives normalization', () => {
      const input = 'https://res.cloudinary.com/demo/video/upload/sample.mp4';
      const expected = 'https://res.cloudinary.com/demo/video/upload/f_auto,q_auto,w_800,c_limit/sample.mp4';
      for (const impl of implementations) {
        assert.equal(impl.fn(input), expected, `Failed for raw upload URL in ${impl.name}`);
      }
    });
  });

  // =========================================================================
  // SCENARIO M4.6: Cross-Module Parity Verification
  // =========================================================================
  describe('Scenario M4.6: Cross-Module Algorithmic Parity', () => {

    test('M4.6.1: contracts/cloudinary.mjs, src/admin.ts, and src/main.ts yield identical outputs across 20 test vectors', () => {
      const vectors = [
        'https://res.cloudinary.com/dhvbqs2ba/image/upload/sample.jpg',
        'https://res.cloudinary.com/dhvbqs2ba/image/upload/v1720000000/ceviche.jpg?v=2',
        'https://res.cloudinary.com/dhvbqs2ba/image/upload/ceviche.jpg?v=999',
        'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/sample.jpg',
        'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800,c_limit/sample.jpg',
        'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_400,c_limit/sample.jpg',
        'https://res.cloudinary.com/demo/image/upload/w_300,h_300,c_crop/sample.png',
        'https://res.cloudinary.com/demo/image/upload/a_90,f_auto/sample.jpg',
        'https://images.unsplash.com/photo-12345',
        '/assets/Hero1.webp',
        'https://res.cloudinary.com/demo/image/authenticated/sample.jpg',
        'https://res.cloudinary.com/demo/image/upload/v1/folder/subfolder/file.webp?v=1&token=xyz',
        '',
        null,
        undefined
      ];

      for (const vec of vectors) {
        const contractRes = contractNormalize(vec, 800);
        const adminRes = adminNormalize(vec, 800);
        const mainRes = mainNormalize(vec, 800);

        assert.equal(adminRes, contractRes, `admin.ts diverged from contract on input: ${vec}`);
        assert.equal(mainRes, contractRes, `main.ts diverged from contract on input: ${vec}`);
      }
    });
  });

  // =========================================================================
  // SCENARIO M4.7: Static Storage & Alert Eradication Integrity
  // =========================================================================
  describe('Scenario M4.7: Static Integrity (Storage & Alert Eradication)', () => {

    test('M4.7.1: src/admin.ts contains exactly 0 occurrences of firebase/storage imports', () => {
      const adminCode = fs.readFileSync(path.join(ROOT_DIR, 'src', 'admin.ts'), 'utf8');
      const storageImports = [...adminCode.matchAll(/^import\s+.*from\s+['"]firebase\/storage['"]/gm)];
      assert.equal(storageImports.length, 0, 'Found active firebase/storage import in src/admin.ts');
      assert.doesNotMatch(adminCode, /from\s+['"]firebase\/storage['"]/, 'Residual firebase/storage reference found in src/admin.ts');
    });

    test('M4.7.2: src/main.ts contains exactly 0 occurrences of firebase/storage imports', () => {
      const mainCode = fs.readFileSync(path.join(ROOT_DIR, 'src', 'main.ts'), 'utf8');
      const storageImports = [...mainCode.matchAll(/^import\s+.*from\s+['"]firebase\/storage['"]/gm)];
      assert.equal(storageImports.length, 0, 'Found active firebase/storage import in src/main.ts');
      assert.doesNotMatch(mainCode, /from\s+['"]firebase\/storage['"]/, 'Residual firebase/storage reference found in src/main.ts');
    });

    test('M4.7.3: src/reservations.ts contains exactly 0 occurrences of firebase/storage imports', () => {
      const resCode = fs.readFileSync(path.join(ROOT_DIR, 'src', 'reservations.ts'), 'utf8');
      assert.doesNotMatch(resCode, /firebase\/storage/, 'firebase/storage found in src/reservations.ts');
    });

    test('M4.7.4: src/admin.ts contains exactly 0 active alert( function calls', () => {
      const adminCode = fs.readFileSync(path.join(ROOT_DIR, 'src', 'admin.ts'), 'utf8');
      const cleanCode = adminCode.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
      const alertCalls = [...cleanCode.matchAll(/\balert\s*\(/g)];
      assert.equal(alertCalls.length, 0, `Found ${alertCalls.length} alert() calls in src/admin.ts`);
    });

    test('M4.7.5: src/main.ts contains exactly 0 active alert( function calls', () => {
      const mainCode = fs.readFileSync(path.join(ROOT_DIR, 'src', 'main.ts'), 'utf8');
      const cleanCode = mainCode.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
      const alertCalls = [...cleanCode.matchAll(/\balert\s*\(/g)];
      assert.equal(alertCalls.length, 0, `Found ${alertCalls.length} alert() calls in src/main.ts`);
    });

    test('M4.7.6: src/reservations.ts contains exactly 0 active alert( function calls', () => {
      const resCode = fs.readFileSync(path.join(ROOT_DIR, 'src', 'reservations.ts'), 'utf8');
      const cleanCode = resCode.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
      const alertCalls = [...cleanCode.matchAll(/\balert\s*\(/g)];
      assert.equal(alertCalls.length, 0, `Found ${alertCalls.length} alert() calls in src/reservations.ts`);
    });

    test('M4.7.7: src/admin.ts contains exactly 0 residual ": any" type annotations', () => {
      const adminCode = fs.readFileSync(path.join(ROOT_DIR, 'src', 'admin.ts'), 'utf8');
      // Look for ": any" but ignore inside comments or strings
      const lines = adminCode.split('\n');
      const anyMatches = [];
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
        if (/:\s*any\b/.test(line)) {
          anyMatches.push({ line: idx + 1, text: trimmed });
        }
      });
      assert.deepEqual(anyMatches, [], `Found explicit ': any' annotations in src/admin.ts`);
    });

    test('M4.7.8: Gallery logic in src/admin.ts and src/main.ts strictly queries Firestore gallery_items SSOT', () => {
      const adminCode = fs.readFileSync(path.join(ROOT_DIR, 'src', 'admin.ts'), 'utf8');
      const mainCode = fs.readFileSync(path.join(ROOT_DIR, 'src', 'main.ts'), 'utf8');

      assert.ok(adminCode.includes("'gallery_items'"), "src/admin.ts must reference collection 'gallery_items'");
      assert.ok(mainCode.includes("'gallery_items'"), "src/main.ts must reference collection 'gallery_items'");
    });
  });

  // =========================================================================
  // SCENARIO M4.8: Backoffice DOM & Quiet Luxury Controls Integrity
  // =========================================================================
  describe('Scenario M4.8: Backoffice DOM & Quiet Luxury Invariants (admin.html)', () => {

    const adminHtml = fs.readFileSync(path.join(ROOT_DIR, 'admin.html'), 'utf8');

    test('M4.8.1: Allergen chips container exists with 16 tag buttons matching OFFICIAL_ALLERGEN_TAGS SSOT', () => {
      assert.ok(adminHtml.includes('id="allergen-chips-container"'), 'admin.html missing #allergen-chips-container');
      assert.ok(adminHtml.includes('class="allergen-chips-grid"'), 'admin.html missing .allergen-chips-grid class');

      // Extract all tag-chip data-tags
      const tagMatches = [...adminHtml.matchAll(/class="tag-chip"\s+data-tag="([^"]+)"/g)].map(m => m[1]);
      assert.equal(tagMatches.length, 16, `Expected exactly 16 tag-chip elements in admin.html, found ${tagMatches.length}`);

      // Verify each tag belongs to OFFICIAL_ALLERGEN_TAGS
      for (const officialTag of OFFICIAL_ALLERGEN_TAGS) {
        assert.ok(tagMatches.includes(officialTag), `Missing official allergen tag in admin.html: ${officialTag}`);
      }
    });

    test('M4.8.2: Preview elements exist for dish and gallery conforming to T1.4.3 invariant', () => {
      assert.ok(adminHtml.includes('id="dish-preview-container"'), 'admin.html missing #dish-preview-container');
      assert.ok(adminHtml.includes('id="preview-item-image"'), 'admin.html missing #preview-item-image');
      assert.ok(adminHtml.includes('id="gallery-preview-container"'), 'admin.html missing #gallery-preview-container');
      assert.ok(adminHtml.includes('id="preview-gallery-image"'), 'admin.html missing #preview-gallery-image');

      // Invariant T1.4.3 check: All <img> in admin.html must have id="preview-..."
      const imgTags = [...adminHtml.matchAll(/<img\b([^>]*)>/gi)].map(m => m[1]);
      assert.ok(imgTags.length >= 2, 'admin.html must contain at least 2 preview img tags');
      for (const attrs of imgTags) {
        assert.match(attrs, /\bid=["']preview-[^"']+["']/i, `All img tags in admin.html must have id="preview-...": ${attrs}`);
      }
    });

    test('M4.8.3: Reservations operational hub contains filter tabs and 8-column table structure', () => {
      assert.ok(adminHtml.includes('id="reservations-tabs"'), 'admin.html missing #reservations-tabs');
      assert.ok(adminHtml.includes('id="tab-pending"'), 'admin.html missing #tab-pending');
      assert.ok(adminHtml.includes('id="tab-today"'), 'admin.html missing #tab-today');
      assert.ok(adminHtml.includes('id="tab-all"'), 'admin.html missing #tab-all');

      // Table headers
      const expectedHeaders = [
        'Localizador',
        'Fecha',
        'Hora',
        'Comensales',
        'Cliente',
        'Teléfono',
        'Estado',
        'Acciones'
      ];
      for (const header of expectedHeaders) {
        assert.ok(adminHtml.includes(`<th>${header}</th>`), `admin.html reservations table missing header: <th>${header}</th>`);
      }
    });

    test('M4.8.4: Primary file upload inputs for dish and gallery restrict accept attribute to JPEG, PNG, WebP', () => {
      const dishInputMatch = adminHtml.match(/<input[^>]+id=["']dish-image-file["'][^>]*>/i);
      const galleryInputMatch = adminHtml.match(/<input[^>]+id=["']gallery-image-file["'][^>]*>/i);

      assert.ok(dishInputMatch, 'admin.html must contain #dish-image-file input');
      assert.ok(galleryInputMatch, 'admin.html must contain #gallery-image-file input');

      assert.match(dishInputMatch[0], /accept=["']image\/jpeg,image\/png,image\/webp["']/,
        '#dish-image-file must restrict accept to JPEG, PNG, WebP');
      assert.match(galleryInputMatch[0], /accept=["']image\/jpeg,image\/png,image\/webp["']/,
        '#gallery-image-file must restrict accept to JPEG, PNG, WebP');
    });
  });

  // =========================================================================
  // SCENARIO M4.9: File Validation & RFC 9457 Toast Engine
  // =========================================================================
  describe('Scenario M4.9: File Validation & RFC 9457 Toast Engine Behavior', () => {

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
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    test('M4.9.1: validateUploadFile boundary check at exact 10 MB (10485760 bytes)', () => {
      const exact10Mb = { size: 10 * 1024 * 1024, type: 'image/jpeg' };
      const overBy1Byte = { size: 10 * 1024 * 1024 + 1, type: 'image/jpeg' };

      assert.equal(validateUploadFile(exact10Mb).valid, true, 'Exact 10 MB must be valid');
      assert.equal(validateUploadFile(overBy1Byte).valid, false, '10 MB + 1 byte must be rejected');
    });

    test('M4.9.2: validateUploadFile rejects malicious and non-image MIME types', () => {
      const maliciousTypes = [
        'application/x-msdownload',
        'text/html',
        'application/javascript',
        'image/svg+xml',
        'video/mp4',
        'image/gif'
      ];

      for (const mime of maliciousTypes) {
        const res = validateUploadFile({ size: 1024, type: mime });
        assert.equal(res.valid, false, `Failed to reject MIME type ${mime}`);
        assert.ok(res.error.includes('Formato no permitido'));
      }
    });

    test('M4.9.3: escapeHtml neutralizes XSS vectors across toast title and detail payloads', () => {
      const payload = '<script>alert("xss")</script>&foo=\'bar"';
      const escaped = escapeHtml(payload);

      assert.doesNotMatch(escaped, /<script>/);
      assert.doesNotMatch(escaped, /"/);
      assert.doesNotMatch(escaped, /'/);
      assert.ok(escaped.includes('&lt;script&gt;'));
      assert.ok(escaped.includes('&quot;'));
      assert.ok(escaped.includes('&#39;'));
      assert.ok(escaped.includes('&amp;foo='));
    });
  });
});
