/**
 * Tier 5: Milestone 6 Production Pipeline & Codebase Invariants Stress Suite
 * SSOT: ORIGINAL_REQUEST.md, PROJECT.md M6, specs/performance-spec.md, specs/design-system-spec.md
 * Agent: m6_challenger_2 (Milestone 6 Challenger - Static Invariant, Asset Hygiene & Production Pipeline Stress)
 * 
 * Conducts exhaustive empirical stress testing and automated invariant verification:
 * 1. Scenario M6.1: Static AST & Codebase Invariants
 *    - Strictly 0 occurrences of active alert( in all TypeScript files in src/
 *    - Strictly 0 occurrences of active window.open in all TypeScript files in src/
 *    - Strictly 0 occurrences of : any or as any in all TypeScript files in src/
 *    - Strictly 0 occurrences of firebase/storage imports across all TypeScript files in src/
 *    - Strictly 0 occurrences of @supabase/supabase-js imports in production entry points
 * 2. Scenario M6.2: HTML Templates & Asset Hygiene
 *    - All 4 HTML templates (index, carta, admin, experiencia) include font preconnect links
 *    - All 4 HTML templates link /src/style.css (specifically inspecting experiencia.html)
 *    - Toast container (<div id="toast-container">) present where toasts are dispatched
 * 3. Scenario M6.3: CSS Design System & Bundle SLA
 *    - Production CSS bundle size SLA (< 35 kB raw, < 10 kB gzip) and raw src/style.css audit
 *    - Strictly 0 occurrences of border: 80px or Nazca SVG background graphics
 *    - Strictly 0 occurrences of .item-photo-btn::after reflective shiny loops
 *    - Canonical Quiet Luxury --lux-* tokens defined in :root
 * 4. Scenario M6.4: Production Build Pipeline Stress
 *    - tsc --noEmit executes with 0 errors in under 20s
 *    - vite build compiles cleanly with exit code 0
 *    - Master pipeline (npm run pipeline) finishes under the 20s SLA
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execSync } from 'node:child_process';

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, 'src');

/**
 * Strips comments from code string to prevent false positives in AST regex matching
 */
function stripComments(code) {
  return code.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
}

describe('Tier 5: Milestone 6 Production Pipeline & Codebase Invariants Stress Suite', () => {

  describe('Scenario M6.1: Static AST & Codebase Invariants Audit', () => {
    const tsFiles = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.ts'));

    test('T5.M6.1: Exactly 0 occurrences of active alert() across ALL TypeScript files in src/', () => {
      const violations = [];
      for (const file of tsFiles) {
        const fullPath = path.join(SRC_DIR, file);
        const code = stripComments(fs.readFileSync(fullPath, 'utf8'));
        const matches = code.match(/\balert\s*\(/g) || [];
        if (matches.length > 0) {
          violations.push(`${file} (${matches.length} active alert calls)`);
        }
      }
      assert.deepEqual(violations, [], `Active alert() found in: ${violations.join(', ')}`);
    });

    test('T5.M6.2: Exactly 0 occurrences of active window.open across ALL TypeScript files in src/', () => {
      const violations = [];
      for (const file of tsFiles) {
        const fullPath = path.join(SRC_DIR, file);
        const code = stripComments(fs.readFileSync(fullPath, 'utf8'));
        const matches = code.match(/window\.open\s*\(/g) || [];
        if (matches.length > 0) {
          violations.push(`${file} (${matches.length} active window.open calls)`);
        }
      }
      assert.deepEqual(violations, [], `Active window.open found in: ${violations.join(', ')}`);
    });

    test('T5.M6.3: Exactly 0 occurrences of ": any" or "as any" across ALL TypeScript files in src/', () => {
      const violations = [];
      for (const file of tsFiles) {
        const fullPath = path.join(SRC_DIR, file);
        const code = stripComments(fs.readFileSync(fullPath, 'utf8'));
        const anyMatches = code.match(/:\s*any\b/g) || [];
        const asAnyMatches = code.match(/\bas\s+any\b/g) || [];
        const total = anyMatches.length + asAnyMatches.length;
        if (total > 0) {
          violations.push(`${file} (${anyMatches.length} ': any', ${asAnyMatches.length} 'as any')`);
        }
      }
      assert.deepEqual(violations, [], `Unsafe any annotations found in: ${violations.join(', ')}`);
    });

    test('T5.M6.4: Exactly 0 occurrences of firebase/storage imports across ALL TypeScript files in src/', () => {
      const violations = [];
      for (const file of tsFiles) {
        const fullPath = path.join(SRC_DIR, file);
        const code = stripComments(fs.readFileSync(fullPath, 'utf8'));
        const matches = code.match(/['"]firebase\/storage['"]/g) || [];
        if (matches.length > 0) {
          violations.push(`${file} (${matches.length} imports)`);
        }
      }
      assert.deepEqual(violations, [], `firebase/storage imports detected in: ${violations.join(', ')}`);
    });

    test('T5.M6.5: Exactly 0 occurrences of supabase imports in production entry points', () => {
      const prodEntryPoints = ['main.ts', 'admin.ts', 'experiencia.ts', 'reservations.ts'];
      const violations = [];
      for (const file of prodEntryPoints) {
        const fullPath = path.join(SRC_DIR, file);
        if (!fs.existsSync(fullPath)) continue;
        const code = stripComments(fs.readFileSync(fullPath, 'utf8'));
        if (code.includes('@supabase/supabase-js') || code.includes('./supabase')) {
          violations.push(file);
        }
      }
      assert.deepEqual(violations, [], `Supabase imports detected in entry points: ${violations.join(', ')}`);
    });
  });

  describe('Scenario M6.2: HTML & Asset Hygiene across all 4 templates', () => {
    const templates = ['index.html', 'carta.html', 'admin.html', 'experiencia.html'];

    test('T5.M6.6: All 4 HTML templates include font preconnect links for Google Fonts', () => {
      const missing = [];
      for (const tmpl of templates) {
        const fullPath = path.join(ROOT_DIR, tmpl);
        assert.ok(fs.existsSync(fullPath), `${tmpl} must exist`);
        const content = fs.readFileSync(fullPath, 'utf8');
        const hasDnsPreconnect = content.includes('rel="preconnect" href="https://fonts.googleapis.com"');
        const hasGstaticPreconnect = content.includes('rel="preconnect" href="https://fonts.gstatic.com" crossorigin');
        if (!hasDnsPreconnect || !hasGstaticPreconnect) {
          missing.push(`${tmpl} (dns: ${hasDnsPreconnect}, gstatic: ${hasGstaticPreconnect})`);
        }
      }
      assert.deepEqual(missing, [], `Missing font preconnect tags in: ${missing.join(', ')}`);
    });

    test('T5.M6.7: Verify stylesheet links across all templates (specifically check experiencia.html for /src/style.css)', () => {
      const missingStyle = [];
      for (const tmpl of templates) {
        const fullPath = path.join(ROOT_DIR, tmpl);
        const content = fs.readFileSync(fullPath, 'utf8');
        const hasStyleCss = content.includes('href="/src/style.css"');
        if (!hasStyleCss) {
          missingStyle.push(tmpl);
        }
      }
      assert.deepEqual(missingStyle, [], `Templates missing link to /src/style.css: ${missingStyle.join(', ')}`);
    });

    test('T5.M6.8: Toast container element (#toast-container) is present in templates where notifications are dispatched', () => {
      const toastPages = ['index.html', 'admin.html', 'experiencia.html'];
      const missingToast = [];
      for (const tmpl of toastPages) {
        const fullPath = path.join(ROOT_DIR, tmpl);
        const content = fs.readFileSync(fullPath, 'utf8');
        const hasToastId = content.includes('id="toast-container"');
        if (!hasToastId) {
          missingToast.push(tmpl);
        }
      }
      assert.deepEqual(missingToast, [], `Missing #toast-container in: ${missingToast.join(', ')}`);
    });
  });

  describe('Scenario M6.3: CSS Design System, Bundle SLA & Visual Hygiene', () => {
    const stylePath = path.join(SRC_DIR, 'style.css');

    test('T5.M6.9: Production CSS bundle size SLA (< 35 kB raw, < 10 kB gzip)', () => {
      const assetsDir = path.join(ROOT_DIR, 'dist', 'assets');
      assert.ok(fs.existsSync(assetsDir), 'dist/assets directory must exist');
      const cssFiles = fs.readdirSync(assetsDir).filter(f => f.startsWith('style-') && f.endsWith('.css'));
      assert.ok(cssFiles.length >= 1, 'Production style-*.css must be present in dist/assets');

      const fullPath = path.join(assetsDir, cssFiles[0]);
      const rawBytes = fs.readFileSync(fullPath).length;
      const gzipBytes = zlib.gzipSync(fs.readFileSync(fullPath)).length;

      const RAW_BUDGET = 35 * 1024; // 35 kB
      const GZIP_BUDGET = 10 * 1024; // 10 kB

      assert.ok(rawBytes < RAW_BUDGET, `Production CSS raw size ${rawBytes} B exceeds 35 kB budget (${RAW_BUDGET} B)`);
      assert.ok(gzipBytes < GZIP_BUDGET, `Production CSS gzip size ${gzipBytes} B exceeds 10 kB budget (${GZIP_BUDGET} B)`);
    });

    test('T5.M6.10: Raw unbundled src/style.css size audit against 35 kB budget', () => {
      const rawBytes = fs.readFileSync(stylePath).length;
      const RAW_BUDGET = 35 * 1024;
      assert.ok(rawBytes < RAW_BUDGET, `Raw src/style.css size ${rawBytes} B (${(rawBytes/1024).toFixed(2)} kB) exceeds budget ${RAW_BUDGET} B (35 kB)`);
    });

    test('T5.M6.11: Strictly 0 occurrences of border: 80px or active Nazca SVG background graphics in CSS', () => {
      const css = fs.readFileSync(stylePath, 'utf8');
      const border80Matches = css.match(/border:\s*80px/gi) || [];
      const border8080Matches = css.match(/80px\s+80px/gi) || [];
      const totalBorder80 = border80Matches.length + border8080Matches.length;
      assert.equal(totalBorder80, 0, `Found border: 80px declarations in src/style.css: ${totalBorder80}`);

      // Ensure Nazca pseudoelements are neutralized
      assert.match(css, /\.page-carta\s+\.section-container::before/i, 'Neutralization rule for ::before must exist');
      assert.match(css, /content:\s*none\s*!important/i, 'Nazca pseudoelements must set content: none !important');
    });

    test('T5.M6.12: Strictly 0 occurrences of .item-photo-btn::after reflective shiny loops in CSS', () => {
      const css = fs.readFileSync(stylePath, 'utf8');
      assert.doesNotMatch(css, /shiny-button/i, 'shiny-button animation must be abolished');
      assert.doesNotMatch(css, /@keyframes\s+shiny/i, '@keyframes shiny must be abolished');

      const photoBtnAfter = css.match(/\.item-photo-btn::after\s*\{([^}]+)\}/);
      assert.ok(photoBtnAfter, '.item-photo-btn::after override rule must exist');
      assert.match(photoBtnAfter[1], /content:\s*none\s*!important/, '.item-photo-btn::after must have content: none !important');
    });

    test('T5.M6.13: All required Quiet Luxury --lux-* tokens are defined in :root', () => {
      const css = fs.readFileSync(stylePath, 'utf8');
      const requiredTokens = [
        '--lux-bg-obsidian',
        '--lux-bg-charcoal',
        '--lux-bg-surface',
        '--lux-bg-alabaster',
        '--lux-bg-parchment',
        '--lux-gold-champagne',
        '--lux-gold-burnished',
        '--lux-crimson-mineral',
        '--lux-text-primary',
        '--lux-text-secondary',
        '--lux-text-muted',
        '--lux-text-dark',
        '--lux-border-hairline',
        '--lux-border-gold-subtle'
      ];

      for (const token of requiredTokens) {
        assert.match(css, new RegExp(`${token}\\s*:`), `Token ${token} must be defined in src/style.css`);
      }
    });
  });

  describe('Scenario M6.4: Production Build Pipeline Stress & Performance Budget', () => {

    test('T5.M6.14: tsc --noEmit completes with exit code 0 and 0 errors in under 20s', () => {
      const start = Date.now();
      assert.doesNotThrow(() => {
        execSync('npx tsc --noEmit', { cwd: ROOT_DIR, stdio: 'pipe', timeout: 20000 });
      }, 'Typecheck failed: tsc --noEmit failed');
      const duration = Date.now() - start;
      assert.ok(duration < 20000, `Typecheck took ${duration}ms, exceeding 20s SLA`);
    });

    test('T5.M6.15: npm run pipeline (tsc --noEmit && vite build) finishes with Exit Code 0 in under 20s', () => {
      const start = Date.now();
      assert.doesNotThrow(() => {
        execSync('npm run pipeline', { cwd: ROOT_DIR, stdio: 'pipe', timeout: 20000 });
      }, 'Master pipeline failed: npm run pipeline exited with non-zero');
      const duration = Date.now() - start;
      assert.ok(duration < 20000, `Pipeline execution took ${duration}ms, exceeding 20s budget`);
    });
  });
});
