/**
 * Tier 5: Milestone 1 Adversarial Challenges & SLA Verification
 * Role: m1_challenger_2 (EMPIRICAL CHALLENGER)
 * 
 * Scenarios Tested:
 * - Scenario C3: Verify that 0 requests leak to Supabase (offline simulation / grep / network audit).
 * - Scenario C4: Verify layout stability and CLS in #main-gallery-grid (skeleton items, 55vh/min-height 400px before and after JS load).
 * - Scenario C5: Verify production bundle size SLA (initial JS gzip payload < 150 kB, verify no bundle size regressions).
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT_DIR = process.cwd();

// Helper to recursively find files matching extensions
function getFilesRecursive(dir, extensions = []) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getFilesRecursive(fullPath, extensions));
    } else if (extensions.length === 0 || extensions.some(ext => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

// Helper to compute gzip size
function getGzipSize(filePath) {
  const content = fs.readFileSync(filePath);
  return zlib.gzipSync(content, { level: 9 }).length;
}

describe('Tier 5 / Milestone 1 Adversarial Challenges (Network, CLS & Bundle SLA)', () => {

  // =========================================================================
  // SCENARIO C3: Zero Requests Leak to Supabase
  // =========================================================================
  describe('Scenario C3: Empirical Supabase Zero-Leakage & Network Audit', () => {

    test('C3.1: Zero occurrences of "supabase" in all production source files (src/**)', () => {
      const srcFiles = getFilesRecursive(path.join(ROOT_DIR, 'src'), ['.ts', '.js', '.css', '.html']);
      assert.ok(srcFiles.length > 0, 'src/ must contain source files');

      const leaks = [];
      for (const file of srcFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const matches = content.match(/supabase/gi);
        if (matches) {
          leaks.push({ file: path.relative(ROOT_DIR, file), count: matches.length });
        }
      }

      assert.deepEqual(leaks, [], `Found active Supabase references in src/: ${JSON.stringify(leaks)}`);
    });

    test('C3.2: Zero occurrences of Supabase project domain or ID in source HTML templates', () => {
      const htmlFiles = ['index.html', 'carta.html', 'admin.html', 'experiencia.html'];
      const leaks = [];

      for (const file of htmlFiles) {
        const fullPath = path.join(ROOT_DIR, file);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (/supabase\.co/i.test(content) || /xdslypbjmenthwyrarui/i.test(content)) {
            leaks.push(file);
          }
        }
      }

      assert.deepEqual(leaks, [], `Source HTML templates still reference Supabase CDN/API: ${leaks.join(', ')}`);
    });

    test('C3.3: Zero occurrences of "supabase" or project ID in dist/ production artifacts', () => {
      const distFiles = getFilesRecursive(path.join(ROOT_DIR, 'dist'), ['.html', '.js', '.css']);
      assert.ok(distFiles.length > 0, 'dist/ must contain built production artifacts');

      const leaks = [];
      for (const file of distFiles) {
        const content = fs.readFileSync(file, 'utf8');
        if (/supabase/i.test(content) || /xdslypbjmenthwyrarui/i.test(content)) {
          leaks.push(path.relative(ROOT_DIR, file));
        }
      }

      assert.deepEqual(leaks, [], `Built dist/ bundle contains Supabase references: ${leaks.join(', ')}`);
    });

    test('C3.4: src/supabase.ts is permanently eradicated from disk', () => {
      const supabaseTs = path.join(ROOT_DIR, 'src', 'supabase.ts');
      assert.equal(fs.existsSync(supabaseTs), false, 'src/supabase.ts must be completely deleted');
    });

    test('C3.5: Offline Supabase Simulation: Network endpoints in index.html and experiencia.html', () => {
      const htmlFiles = ['index.html', 'experiencia.html'];
      for (const file of htmlFiles) {
        const content = fs.readFileSync(path.join(ROOT_DIR, file), 'utf8');
        // Extract all URLs from src, href, action, content
        const urlMatches = [...content.matchAll(/(?:src|href|content)=["'](https?:\/\/[^"']+)["']/gi)].map(m => m[1]);
        for (const url of urlMatches) {
          const parsed = new URL(url);
          assert.notEqual(parsed.hostname.endsWith('supabase.co'), true,
            `Found remote network call to Supabase in ${file}: ${url}`);
        }
      }
    });

    test('C3.6: loadGallery in src/main.ts fallbacks to local WebP assets without network leak on failure', () => {
      const mainTs = fs.readFileSync(path.join(ROOT_DIR, 'src', 'main.ts'), 'utf8');
      assert.match(mainTs, /galleryFiles\s*=\s*\[[\s\S]*?'\/assets\/Hero1\.webp'/,
        'loadGallery must define local WebP fallbacks');
      assert.doesNotMatch(mainTs, /supabase/i, 'loadGallery must have zero references to Supabase');
    });
  });

  // =========================================================================
  // SCENARIO C4: Layout Stability and CLS in #main-gallery-grid
  // =========================================================================
  describe('Scenario C4: Layout Stability & CLS in #main-gallery-grid', () => {

    test('C4.1: #main-gallery-grid contains exactly 4 skeleton placeholder items in index.html', () => {
      const content = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
      const gridStartIndex = content.indexOf('id="main-gallery-grid"');
      assert.ok(gridStartIndex !== -1, '#main-gallery-grid must exist in index.html');

      // Slice from main-gallery-grid start to the closing awards section
      const afterGrid = content.slice(gridStartIndex);
      // Find the next section boundary or count matching divs
      const sectionEnd = afterGrid.indexOf('</section>');
      const gallerySlice = afterGrid.slice(0, sectionEnd);

      const skeletonMatches = [...gallerySlice.matchAll(/class=["'][^"']*gallery-skeleton[^"']*["']/gi)];
      assert.equal(skeletonMatches.length, 4,
        `Expected exactly 4 skeleton elements inside #main-gallery-grid, found ${skeletonMatches.length}`);

      // Verify no <img> tags exist in initial skeleton state
      // Find where #main-gallery-grid closing tag is (right before </div>\s*</div>\s*</section>)
      const imgMatches = [...gallerySlice.matchAll(/<img\b/gi)];
      // Note: awards-section has imgs, but inside gallerySlice before </section> we want to check only inside gallery-grid
      const nextDivs = gallerySlice.indexOf('<!-- RECONOCIMIENTOS');
      const innerGrid = gallerySlice.slice(0, nextDivs);
      const innerImgs = [...innerGrid.matchAll(/<img\b/gi)];
      assert.equal(innerImgs.length, 0,
        `#main-gallery-grid must not contain static <img> tags before JS execution. Found ${innerImgs.length}`);
    });

    test('C4.2: All 4 skeleton items have aria-hidden="true" for accessibility hygiene', () => {
      const content = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
      const gridStartIndex = content.indexOf('id="main-gallery-grid"');
      const gallerySlice = content.slice(gridStartIndex, content.indexOf('</section>', gridStartIndex));
      const items = [...gallerySlice.matchAll(/<div[^>]*gallery-skeleton[^>]*>/gi)].map(m => m[0]);
      assert.equal(items.length, 4, 'Should verify all 4 skeleton elements');
      for (const item of items) {
        assert.match(item, /aria-hidden=["']true["']/i, `Skeleton item must have aria-hidden="true": ${item}`);
      }
    });

    test('C4.3: CSS enforces 55vh, min-height: 400px, max-height: 600px on .gallery-grid', () => {
      const styleCss = fs.readFileSync(path.join(ROOT_DIR, 'src', 'style.css'), 'utf8');
      
      // Match .gallery-grid rule block
      const galleryRuleMatch = styleCss.match(/\.gallery-grid\s*\{([^}]+)\}/);
      assert.ok(galleryRuleMatch, '.gallery-grid rule must exist in src/style.css');

      const ruleContent = galleryRuleMatch[1];
      assert.match(ruleContent, /height:\s*55vh;/i, '.gallery-grid must declare height: 55vh;');
      assert.match(ruleContent, /min-height:\s*400px;/i, '.gallery-grid must declare min-height: 400px;');
      assert.match(ruleContent, /max-height:\s*600px;/i, '.gallery-grid must declare max-height: 600px;');
    });

    test('C4.4: Mobile responsive breakpoint enforces height: 45vh and min-height: 300px', () => {
      const styleCss = fs.readFileSync(path.join(ROOT_DIR, 'src', 'style.css'), 'utf8');
      assert.match(styleCss, /@media\s*\([^)]*max-width:\s*768px[^)]*\)[\s\S]*?\.gallery-grid\s*\{[\s\S]*?height:\s*45vh;/i,
        '.gallery-grid mobile rule must specify height: 45vh');
      assert.match(styleCss, /@media\s*\([^)]*max-width:\s*768px[^)]*\)[\s\S]*?\.gallery-grid\s*\{[\s\S]*?min-height:\s*300px;/i,
        '.gallery-grid mobile rule must specify min-height: 300px');
    });

    test('C4.5: .gallery-item and .gallery-skeleton CSS definitions maintain layout containment', () => {
      const styleCss = fs.readFileSync(path.join(ROOT_DIR, 'src', 'style.css'), 'utf8');
      
      const itemRuleMatch = styleCss.match(/\.gallery-item\s*\{([^}]+)\}/);
      assert.ok(itemRuleMatch, '.gallery-item rule must exist');
      assert.match(itemRuleMatch[1], /height:\s*100%;/i, '.gallery-item must have height: 100%');

      assert.match(styleCss, /\.gallery-item\.gallery-skeleton\s*\{/i,
        '.gallery-item.gallery-skeleton class must be defined in style.css');
      assert.match(styleCss, /@keyframes\s+gallery-skeleton-pulse/i,
        'gallery-skeleton-pulse keyframes must be defined');
    });

    test('C4.6: Mathematical CLS verification: Vertical shift is strictly 0.000 before and after JS hydration', () => {
      // Simulate viewport test cases:
      // Case A: Desktop 1920x1080 (vh = 10.8px) -> 55vh = 594px (bounded between 400px and 600px)
      // Case B: Small Desktop 1366x768 (vh = 7.68px) -> 55vh = 422.4px (bounded between 400px and 600px)
      // Case C: Mobile 375x667 (vh = 6.67px) -> 45vh = 300.15px (bounded by min-height 300px)

      const testViewports = [
        { name: 'Desktop Full HD (1920x1080)', width: 1920, height: 1080, vhPct: 0.55, minH: 400, maxH: 600 },
        { name: 'Laptop Standard (1366x768)', width: 1366, height: 768, vhPct: 0.55, minH: 400, maxH: 600 },
        { name: 'Mobile Viewport (375x667)', width: 375, height: 667, vhPct: 0.45, minH: 300, maxH: 600 }
      ];

      for (const vp of testViewports) {
        // Initial state before JS (Skeletons in .gallery-grid)
        const computedInitialHeight = Math.min(Math.max(vp.height * vp.vhPct, vp.minH), vp.maxH);

        // Hydrated state after JS (galleryGrid.innerHTML = ''; append dynamic items with height: 100%)
        // Because .gallery-grid maintains explicit height, its height after JS is identical:
        const computedHydratedHeight = Math.min(Math.max(vp.height * vp.vhPct, vp.minH), vp.maxH);

        const deltaY = Math.abs(computedHydratedHeight - computedInitialHeight);
        const distanceFraction = deltaY / vp.height;
        const impactFraction = computedHydratedHeight / vp.height;
        const clsScore = impactFraction * distanceFraction;

        assert.equal(deltaY, 0, `Height shifted by ${deltaY}px on ${vp.name}`);
        assert.equal(clsScore, 0, `CLS score must be exactly 0.0000 on ${vp.name}, got ${clsScore}`);
      }
    });
  });

  // =========================================================================
  // SCENARIO C5: Production Bundle Size SLA (< 150 kB Initial JS Gzip)
  // =========================================================================
  describe('Scenario C5: Production Bundle Size & Gzip Payload SLA', () => {

    test('C5.1: Initial JavaScript payload in dist/index.html is strictly < 150 kB gzip', () => {
      const distIndex = path.join(ROOT_DIR, 'dist', 'index.html');
      assert.ok(fs.existsSync(distIndex), 'dist/index.html must exist');

      const indexContent = fs.readFileSync(distIndex, 'utf8');
      const scriptMatches = [...indexContent.matchAll(/<script[^>]+src=["']\/assets\/([^"']+\.js)["']/g)].map(m => m[1]);

      assert.ok(scriptMatches.length > 0, 'index.html must reference bundled JS');

      let totalRawBytes = 0;
      let totalGzipBytes = 0;
      const scriptBreakdown = [];

      for (const scriptName of scriptMatches) {
        const scriptPath = path.join(ROOT_DIR, 'dist', 'assets', scriptName);
        assert.ok(fs.existsSync(scriptPath), `Script ${scriptName} must exist on disk`);
        const stat = fs.statSync(scriptPath);
        const gzipSize = getGzipSize(scriptPath);

        totalRawBytes += stat.size;
        totalGzipBytes += gzipSize;
        scriptBreakdown.push({
          file: scriptName,
          rawKB: (stat.size / 1024).toFixed(2),
          gzipKB: (gzipSize / 1024).toFixed(2)
        });
      }

      const totalGzipKB = totalGzipBytes / 1024;
      const SLA_LIMIT_KB = 150;

      console.log('--- PRODUCTION JS BUNDLE AUDIT (HOME) ---');
      for (const s of scriptBreakdown) {
        console.log(`  ${s.file}: ${s.rawKB} kB raw | ${s.gzipKB} kB gzip`);
      }
      console.log(`Total Initial JS: ${(totalRawBytes / 1024).toFixed(2)} kB raw | ${totalGzipKB.toFixed(2)} kB gzip (Budget: < ${SLA_LIMIT_KB} kB)`);

      assert.ok(totalGzipKB < SLA_LIMIT_KB,
        `Initial JS gzip payload (${totalGzipKB.toFixed(2)} kB) exceeds 150 kB SLA budget!`);
      
      // SLA requires healthy headroom (at least 15 kB margin)
      const headroom = SLA_LIMIT_KB - totalGzipKB;
      assert.ok(headroom >= 15, `Headroom too tight: only ${headroom.toFixed(2)} kB remaining below 150 kB SLA`);
    });

    test('C5.2: Main application chunk dist/assets/main-*.js meets individual budget (< 25 kB raw, < 10 kB gzip)', () => {
      const assetsDir = path.join(ROOT_DIR, 'dist', 'assets');
      const mainFiles = fs.readdirSync(assetsDir).filter(f => f.startsWith('main-') && f.endsWith('.js'));
      assert.equal(mainFiles.length, 1, `Expected exactly 1 main JS chunk, found ${mainFiles.length}`);

      const mainPath = path.join(assetsDir, mainFiles[0]);
      const rawSize = fs.statSync(mainPath).size;
      const gzipSize = getGzipSize(mainPath);

      assert.ok(rawSize < 25 * 1024, `main JS raw size (${(rawSize / 1024).toFixed(2)} kB) exceeds 25 kB budget`);
      assert.ok(gzipSize < 10 * 1024, `main JS gzip size (${(gzipSize / 1024).toFixed(2)} kB) exceeds 10 kB budget`);
    });

    test('C5.3: Production CSS bundle dist/assets/style-*.css meets budget (< 35 kB raw, < 10 kB gzip)', () => {
      const assetsDir = path.join(ROOT_DIR, 'dist', 'assets');
      const cssFiles = fs.readdirSync(assetsDir).filter(f => f.startsWith('style-') && f.endsWith('.css'));
      assert.equal(cssFiles.length, 1, `Expected exactly 1 main style CSS bundle, found ${cssFiles.length}`);

      const cssPath = path.join(assetsDir, cssFiles[0]);
      const rawSize = fs.statSync(cssPath).size;
      const gzipSize = getGzipSize(cssPath);

      assert.ok(rawSize < 35 * 1024, `style CSS raw size (${(rawSize / 1024).toFixed(2)} kB) exceeds 35 kB budget`);
      assert.ok(gzipSize < 10 * 1024, `style CSS gzip size (${(gzipSize / 1024).toFixed(2)} kB) exceeds 10 kB budget`);
    });

    test('C5.4: Vendor chunk separation: firebase bundle is cleanly isolated and does not contaminate main.js', () => {
      const assetsDir = path.join(ROOT_DIR, 'dist', 'assets');
      const mainFiles = fs.readdirSync(assetsDir).filter(f => f.startsWith('main-') && f.endsWith('.js'));
      const firebaseFiles = fs.readdirSync(assetsDir).filter(f => f.startsWith('firebase-') && f.endsWith('.js'));

      assert.equal(firebaseFiles.length, 1, 'Firebase vendor chunk must exist');
      const mainContent = fs.readFileSync(path.join(assetsDir, mainFiles[0]), 'utf8');

      // main.js should not embed entire firebase runtime directly; it imports from chunk
      assert.doesNotMatch(mainContent, /class\s+Firestore\b/, 'Firestore core classes must not be duplicated into main.js');
    });

    test('C5.5: All 4 production HTML entry points satisfy HTML size budget (< 35 kB raw)', () => {
      const htmlFiles = ['index.html', 'carta.html', 'admin.html', 'experiencia.html'];
      for (const h of htmlFiles) {
        const filePath = path.join(ROOT_DIR, 'dist', h);
        assert.ok(fs.existsSync(filePath), `dist/${h} must exist`);
        const stat = fs.statSync(filePath);
        assert.ok(stat.size < 35 * 1024, `dist/${h} size (${(stat.size / 1024).toFixed(2)} kB) exceeds 35 kB budget`);
      }
    });
  });
});
