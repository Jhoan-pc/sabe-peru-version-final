/**
 * Tier 5: Adversarial Challenger Stress Suite (Milestone 2)
 * Formal SSOT: PROJECT.md M2, specs/design-system-spec.md §1-§4, SDD_MASTER [DT-05], [DT-06], [DT-07]
 * Agent: m2_challenger_1_gen2 (EMPIRICAL CHALLENGER)
 * 
 * Conducts empirical adversarial challenges on Milestone 2 visual changes and CSS SLA:
 * 1. Scenario C1: Deprecation invariants (0 occurrences of #2e2620, 80px 80px, shiny-button in src/style.css and dist)
 * 2. Scenario C2: Production CSS bundle size SLA (< 35 kB raw, < 10 kB gzip)
 * 3. Scenario C3: Real Headless Chrome DOM rendering & computed styles for .page-carta .section-container across 5 viewports
 * 4. Scenario C4: Backoffice typography hygiene and runtime defensive whitelist
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import cp from 'node:child_process';
import os from 'node:os';
import http from 'node:http';

const ROOT_DIR = process.cwd();

describe('Tier 5: Adversarial Challenger Stress Suite (Milestone 2)', () => {

  describe('Scenario C1: Visual Deprecation Invariants & Zero Regression', () => {

    test('T5.M2.1: src/style.css contains strictly 0 occurrences of #2e2620 (and case/format variations)', () => {
      const stylePath = path.join(ROOT_DIR, 'src', 'style.css');
      const css = fs.readFileSync(stylePath, 'utf8');

      // Check hex variations
      const hexMatches = css.match(/2e2620/i) || [];
      assert.equal(hexMatches.length, 0, `Expected 0 matches for 2e2620 in src/style.css, found ${hexMatches.length}`);

      // Check RGB equivalent rgb(46, 38, 32)
      const rgbMatches = css.match(/rgb\(\s*46\s*,\s*38\s*,\s*32\s*\)/i) || [];
      assert.equal(rgbMatches.length, 0, `Expected 0 matches for rgb(46, 38, 32) in src/style.css, found ${rgbMatches.length}`);
    });

    test('T5.M2.2: src/style.css contains strictly 0 occurrences of "80px 80px" stone border declaration', () => {
      const stylePath = path.join(ROOT_DIR, 'src', 'style.css');
      const css = fs.readFileSync(stylePath, 'utf8');

      const matches = css.match(/80px\s+80px/i) || [];
      assert.equal(matches.length, 0, `Expected 0 matches for "80px 80px" in src/style.css, found ${matches.length}`);
    });

    test('T5.M2.3: src/style.css contains strictly 0 occurrences of "shiny-button" and keyframes', () => {
      const stylePath = path.join(ROOT_DIR, 'src', 'style.css');
      const css = fs.readFileSync(stylePath, 'utf8');

      const shinyMatches = css.match(/shiny-button/i) || [];
      assert.equal(shinyMatches.length, 0, `Expected 0 matches for shiny-button in src/style.css, found ${shinyMatches.length}`);

      const keyframesMatches = css.match(/@keyframes\s+shiny/i) || [];
      assert.equal(keyframesMatches.length, 0, `Expected 0 matches for @keyframes shiny in src/style.css, found ${keyframesMatches.length}`);
    });

    test('T5.M2.4: Production CSS bundles in dist/assets/ contain strictly 0 occurrences of deprecated patterns', () => {
      const assetsDir = path.join(ROOT_DIR, 'dist', 'assets');
      assert.ok(fs.existsSync(assetsDir), 'dist/assets directory must exist');

      const cssFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.css'));
      assert.ok(cssFiles.length >= 1, 'At least 1 CSS file should be in dist/assets');

      for (const file of cssFiles) {
        const content = fs.readFileSync(path.join(assetsDir, file), 'utf8');
        assert.equal((content.match(/2e2620/i) || []).length, 0, `${file} must contain 0 occurrences of 2e2620`);
        assert.equal((content.match(/80px\s+80px/i) || []).length, 0, `${file} must contain 0 occurrences of 80px 80px`);
        assert.equal((content.match(/shiny-button/i) || []).length, 0, `${file} must contain 0 occurrences of shiny-button`);
      }
    });

    test('T5.M2.5: :root contains all canonical --lux-* design tokens matching specification', () => {
      const stylePath = path.join(ROOT_DIR, 'src', 'style.css');
      const css = fs.readFileSync(stylePath, 'utf8');

      const requiredTokens = [
        { token: '--lux-bg-obsidian', expected: '#0b0b0b' },
        { token: '--lux-bg-charcoal', expected: '#141414' },
        { token: '--lux-bg-surface', expected: '#1c1b1a' },
        { token: '--lux-bg-alabaster', expected: '#fbf9f5' },
        { token: '--lux-bg-parchment', expected: '#f4efe8' },
        { token: '--lux-gold-champagne', expected: '#c5a880' },
        { token: '--lux-gold-burnished', expected: '#a88d65' },
        { token: '--lux-crimson-mineral', expected: '#8b1e22' },
        { token: '--lux-text-primary', expected: '#f5f2eb' },
        { token: '--lux-text-secondary', expected: '#c0bab0' },
        { token: '--lux-text-muted', expected: '#858076' },
        { token: '--lux-text-dark', expected: '#1a1918' },
        { token: '--lux-border-hairline', expected: 'rgba(245, 242, 235, 0.08)' },
        { token: '--lux-border-gold-subtle', expected: 'rgba(197, 168, 128, 0.20)' }
      ];

      for (const req of requiredTokens) {
        const regex = new RegExp(`${req.token}\\s*:\\s*([^;]+);`);
        const match = css.match(regex);
        assert.ok(match, `Token ${req.token} must be defined in src/style.css`);
        const value = match[1].trim();
        assert.ok(value.includes(req.expected), `Token ${req.token} value "${value}" must include expected "${req.expected}"`);
      }
    });

    test('T5.M2.6: Photo trigger contract (.dish-photo-trigger and neutralized .item-photo-btn) is fully met', () => {
      const stylePath = path.join(ROOT_DIR, 'src', 'style.css');
      const css = fs.readFileSync(stylePath, 'utf8');

      // Check .dish-photo-trigger
      assert.match(css, /\.dish-photo-trigger\s*\{/, '.dish-photo-trigger must be declared in src/style.css');
      assert.match(css, /\.dish-photo-trigger\s+\.trigger-line/, '.dish-photo-trigger .trigger-line must be declared');
      assert.match(css, /\.dish-photo-trigger:hover\s+\.trigger-line\s*\{\s*width:\s*100%/, 'Hover must expand trigger-line to 100%');

      // Check legacy bridge .item-photo-btn::after is neutralized
      const btnAfterMatch = css.match(/\.item-photo-btn::after\s*\{([^}]+)\}/);
      assert.ok(btnAfterMatch, '.item-photo-btn::after must have explicit override rule');
      assert.match(btnAfterMatch[1], /content:\s*none\s*!important/, '.item-photo-btn::after must set content: none !important');
      assert.match(btnAfterMatch[1], /display:\s*none\s*!important/, '.item-photo-btn::after must set display: none !important');
    });
  });

  describe('Scenario C2: Production CSS Bundle Size SLA', () => {

    test('T5.M2.7: Production style-*.css is strictly < 35 kB raw (35,840 bytes) and < 10 kB gzip (10,240 bytes)', () => {
      const assetsDir = path.join(ROOT_DIR, 'dist', 'assets');
      const mainCss = fs.readdirSync(assetsDir).find(f => f.startsWith('style-') && f.endsWith('.css'));
      assert.ok(mainCss, 'Production style-*.css must exist in dist/assets');

      const fullPath = path.join(assetsDir, mainCss);
      const rawBytes = fs.readFileSync(fullPath).length;
      const gzipBytes = zlib.gzipSync(fs.readFileSync(fullPath)).length;

      const RAW_BUDGET = 35 * 1024; // 35 kB = 35840 bytes
      const GZIP_BUDGET = 10 * 1024; // 10 kB = 10240 bytes

      assert.ok(rawBytes < RAW_BUDGET, `style-*.css raw size ${rawBytes} B (${(rawBytes/1024).toFixed(2)} kB) exceeds budget ${RAW_BUDGET} B`);
      assert.ok(gzipBytes < GZIP_BUDGET, `style-*.css gzip size ${gzipBytes} B (${(gzipBytes/1024).toFixed(2)} kB) exceeds budget ${GZIP_BUDGET} B`);
    });

    test('T5.M2.8: Total production CSS payload across all emitted bundles meets SLA', () => {
      const assetsDir = path.join(ROOT_DIR, 'dist', 'assets');
      const cssFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.css'));

      let totalRaw = 0;
      let totalGzip = 0;

      for (const file of cssFiles) {
        const buf = fs.readFileSync(path.join(assetsDir, file));
        totalRaw += buf.length;
        totalGzip += zlib.gzipSync(buf).length;
      }

      // Total combined CSS for the entire MPA
      assert.ok(totalRaw < 45 * 1024, `Total raw CSS ${totalRaw} B (${(totalRaw/1024).toFixed(2)} kB) exceeds 45 kB SLA`);
      assert.ok(totalGzip < 12 * 1024, `Total gzip CSS ${totalGzip} B (${(totalGzip/1024).toFixed(2)} kB) exceeds 12 kB SLA`);
    });
  });

  describe('Scenario C3: Headless Chrome Empirical DOM Rendering & Layout Audit', () => {

    const chromeCandidates = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    const availableBrowser = chromeCandidates.find(p => fs.existsSync(p));

    async function evaluateChromeCDP(viewports) {
      if (!availableBrowser) {
        return null;
      }

      const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.png': 'image/png',
        '.svg': 'image/svg+xml'
      };

      // Ephemeral HTTP static server for dist/
      const staticServer = http.createServer((req, res) => {
        const reqPath = req.url.split('?')[0];
        const safePath = path.join(ROOT_DIR, 'dist', reqPath === '/' ? 'index.html' : reqPath);
        if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
          const ext = path.extname(safePath);
          res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
          fs.createReadStream(safePath).pipe(res);
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      });

      const serverPort = 8765 + Math.floor(Math.random() * 100);
      await new Promise(resolve => staticServer.listen(serverPort, '127.0.0.1', resolve));

      const tmpDir = path.join(os.tmpdir(), 'chrome-m2-audit-' + Date.now());
      const cdpPort = 9340 + Math.floor(Math.random() * 50);

      const browserProc = cp.spawn(availableBrowser, [
        '--headless=new',
        '--user-data-dir=' + tmpDir,
        '--remote-debugging-port=' + cdpPort,
        '--disable-gpu',
        'about:blank'
      ], { stdio: 'ignore' });

      const cdpSend = (ws, method, params = {}) => new Promise((resolve, reject) => {
        const id = Math.floor(Math.random() * 1000000);
        const onMsg = (evt) => {
          const msg = JSON.parse(evt.data);
          if (msg.id === id) {
            ws.removeEventListener('message', onMsg);
            if (msg.error) reject(new Error(msg.error.message));
            else resolve(msg.result);
          }
        };
        ws.addEventListener('message', onMsg);
        ws.send(JSON.stringify({ id, method, params }));
      });

      try {
        await new Promise(r => setTimeout(r, 1200));
        const newTargetRes = await fetch(`http://127.0.0.1:${cdpPort}/json/new`, { method: 'PUT' });
        const target = await newTargetRes.json();
        const ws = new WebSocket(target.webSocketDebuggerUrl);
        await new Promise(r => ws.addEventListener('open', r));

        await cdpSend(ws, 'Page.enable');

        const cartaUrl = `http://127.0.0.1:${serverPort}/carta.html`;
        const results = [];

        for (const vp of viewports) {
          await cdpSend(ws, 'Emulation.setDeviceMetricsOverride', {
            width: vp.width,
            height: vp.height,
            deviceScaleFactor: 1,
            mobile: vp.width <= 768
          });

          await cdpSend(ws, 'Page.navigate', { url: cartaUrl });

          let auditValue = { error: 'Not found' };
          for (let attempt = 0; attempt < 15; attempt++) {
            await new Promise(r => setTimeout(r, 200));
            const res = await cdpSend(ws, 'Runtime.evaluate', {
              expression: `(() => {
                const c = document.querySelector('.page-carta .section-container');
                if (!c) return { error: 'Not found' };
                const cs = window.getComputedStyle(c);
                const before = window.getComputedStyle(c, '::before');
                const after = window.getComputedStyle(c, '::after');
                const rect = c.getBoundingClientRect();
                return {
                  viewport: { w: window.innerWidth, h: window.innerHeight },
                  rect: {
                    width: Math.round(rect.width),
                    height: Math.round(rect.height),
                    left: Math.round(rect.left),
                    right: Math.round(rect.right)
                  },
                  scrollWidth: document.documentElement.scrollWidth,
                  clientWidth: document.documentElement.clientWidth,
                  hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
                  styles: {
                    backgroundColor: cs.backgroundColor,
                    borderTopWidth: cs.borderTopWidth,
                    borderRightWidth: cs.borderRightWidth,
                    borderBottomWidth: cs.borderBottomWidth,
                    borderLeftWidth: cs.borderLeftWidth,
                    borderTopColor: cs.borderTopColor,
                    borderTopStyle: cs.borderTopStyle,
                    borderRadius: cs.borderRadius,
                    maxWidth: cs.maxWidth,
                    overflow: cs.overflow,
                    position: cs.position,
                    boxShadow: cs.boxShadow
                  },
                  pseudoBefore: { content: before.content, display: before.display },
                  pseudoAfter: { content: after.content, display: after.display }
                };
              })()`,
              returnByValue: true
            });

            if (res?.result?.value && !res.result.value.error) {
              auditValue = res.result.value;
              break;
            }
          }

          results.push({ viewport: vp, audit: auditValue });
        }

        ws.close();
        return results;
      } finally {
        browserProc.kill();
        try { staticServer.close(); } catch (e) {}
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
      }
    }

    test('T5.M2.9: .page-carta .section-container renders with Quiet Luxury computed styles in real browser', async () => {
      const viewports = [
        { name: 'Desktop 1280px', width: 1280, height: 800 }
      ];

      const results = await evaluateChromeCDP(viewports);
      if (!results) {
        // Fallback test on CSS stylesheet AST
        const css = fs.readFileSync(path.join(ROOT_DIR, 'src', 'style.css'), 'utf8');
        assert.match(css, /\.page-carta\s+\.section-container\s*\{[^}]+background-color:\s*var\(--lux-bg-obsidian\)/);
        return;
      }

      const desktop = results[0].audit;
      assert.ok(!desktop.error, 'Container must be found in rendered DOM');

      // 1. Background color must be Obsidian rgb(11, 11, 11)
      assert.equal(desktop.styles.backgroundColor, 'rgb(11, 11, 11)', 'Computed background-color must be Obsidian rgb(11, 11, 11)');

      // 2. Border must be hairline 1px (NOT 80px)
      assert.equal(desktop.styles.borderTopWidth, '1px', 'Computed borderTopWidth must be 1px');
      assert.equal(desktop.styles.borderRightWidth, '1px', 'Computed borderRightWidth must be 1px');
      assert.equal(desktop.styles.borderBottomWidth, '1px', 'Computed borderBottomWidth must be 1px');
      assert.equal(desktop.styles.borderLeftWidth, '1px', 'Computed borderLeftWidth must be 1px');
      assert.equal(desktop.styles.borderTopStyle, 'solid', 'Computed borderTopStyle must be solid');

      // 3. Border radius must be 2px
      assert.equal(desktop.styles.borderRadius, '2px', 'Computed borderRadius must be 2px');

      // 4. Max width must be 1000px
      assert.equal(desktop.styles.maxWidth, '1000px', 'Computed maxWidth must be 1000px');

      // 5. Overflow must be hidden
      assert.equal(desktop.styles.overflow, 'hidden', 'Computed overflow must be hidden');

      // 6. Pseudoelements must be none / disabled
      assert.ok(
        desktop.pseudoBefore.content === 'none' || desktop.pseudoBefore.display === 'none',
        '::before pseudoelement must be disabled (content: none or display: none)'
      );
      assert.ok(
        desktop.pseudoAfter.content === 'none' || desktop.pseudoAfter.display === 'none',
        '::after pseudoelement must be disabled (content: none or display: none)'
      );
    });

    test('T5.M2.10: Responsive layout stability: Zero horizontal scroll overflow across all 5 viewports', async () => {
      const viewports = [
        { name: 'Mobile Small', width: 320, height: 640 },
        { name: 'Mobile Standard', width: 375, height: 812 },
        { name: 'Tablet', width: 768, height: 1024 },
        { name: 'Desktop Standard', width: 1280, height: 800 },
        { name: 'Widescreen Ultra', width: 1920, height: 1080 }
      ];

      const results = await evaluateChromeCDP(viewports);
      if (!results) {
        return; // Browser not available
      }

      for (const item of results) {
        const { viewport, audit } = item;
        assert.ok(!audit.error, `Viewport ${viewport.name} failed: ${audit.error}`);

        // Zero horizontal blowout
        assert.equal(
          audit.hasHorizontalOverflow,
          false,
          `Viewport ${viewport.name} (${viewport.width}px) triggered horizontal overflow! scrollWidth=${audit.scrollWidth} > innerWidth=${viewport.width}`
        );

        // Container bounding width must never exceed viewport width
        assert.ok(
          audit.rect.width <= viewport.width,
          `Container width (${audit.rect.width}px) exceeds viewport width (${viewport.width}px) in ${viewport.name}`
        );

        // Mobile border sanity: hairline 1px maintained on mobile
        if (viewport.width <= 768) {
          assert.equal(audit.styles.borderTopWidth, '1px', `Mobile border width must remain 1px in ${viewport.name}`);
        }
      }
    });
  });

  describe('Scenario C4: Backoffice Font Selectors & Defensive Whitelist Sanitation', () => {

    test('T5.M2.11: admin.html restricts font selectors strictly to Cormorant Garamond / Playfair Display & Inter / Montserrat', () => {
      const adminPath = path.join(ROOT_DIR, 'admin.html');
      const html = fs.readFileSync(adminPath, 'utf8');

      // Prohibited fonts in admin selectors
      const forbiddenFonts = ['Cinzel', 'DM Serif Display', 'Lato', 'Open Sans', 'Roboto', 'Playfair_Display'];
      for (const font of forbiddenFonts) {
        assert.doesNotMatch(
          html,
          new RegExp(`<option[^>]*value=["'][^"']*${font}[^"']*["']`, 'i'),
          `admin.html must not contain option for forbidden font "${font}"`
        );
      }

      // Allowed fonts must be present
      assert.match(html, /<option[^>]*value=["']'Cormorant Garamond', serif["']/, 'admin.html must contain Cormorant Garamond option');
      assert.match(html, /<option[^>]*value=["']'Playfair Display', serif["']/, 'admin.html must contain Playfair Display option');
      assert.match(html, /<option[^>]*value=["']'Inter', sans-serif["']/, 'admin.html must contain Inter option');
      assert.match(html, /<option[^>]*value=["']'Montserrat', sans-serif["']/, 'admin.html must contain Montserrat option');
    });

    test('T5.M2.12: src/main.ts enforces defensive font whitelist before injecting styles', () => {
      const mainPath = path.join(ROOT_DIR, 'src', 'main.ts');
      const ts = fs.readFileSync(mainPath, 'utf8');

      // Check defensive whitelist arrays
      assert.match(ts, /allowedSerifs?\s*=\s*\[/, 'main.ts must declare allowedSerif(s) whitelist');
      assert.match(ts, /allowedSans\s*=\s*\[/, 'main.ts must declare allowedSans whitelist');
      assert.match(ts, /allowedSerifs?\.includes/, 'main.ts must validate font against allowedSerif(s) before injecting');
      assert.match(ts, /allowedSans\.includes/, 'main.ts must validate font against allowedSans before injecting');
    });
  });
});
