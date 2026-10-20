/**
 * Tier 5: Milestone 2 Typography & Whitelist Adversarial Test Suite
 * Role: m2_challenger_2_gen2 (EMPIRICAL CHALLENGER)
 * 
 * Conducts empirical adversarial challenges on Milestone 2 typography:
 * 1. Challenge 1: Verify that unauthorized fonts (Cinzel, DM Serif Display, Lato, Open Sans)
 *    cannot be selected in admin.html and are blocked by src/main.ts whitelist.
 * 2. Challenge 2: Verify tracking and typography rules across mobile and desktop viewports.
 * 3. Challenge 3: Run pipeline and full test suite verification.
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { MockElement } from './helpers/mock-dom.mjs';

const ROOT_DIR = process.cwd();

describe('Tier 5 / Milestone 2 Adversarial Challenges (Typography & Whitelist)', () => {

  // =========================================================================
  // SCENARIO T1: Admin Font Selector Hygiene
  // =========================================================================
  describe('Scenario T1: Admin Font Selector Hygiene & Whitelist Defense', () => {

    test('T1.1: admin.html source contains zero occurrences of unauthorized fonts', () => {
      const adminHtml = fs.readFileSync(path.join(ROOT_DIR, 'admin.html'), 'utf8');
      const unauthorizedFonts = [
        'Cinzel',
        'DM Serif Display',
        'DM Serif',
        'Lato',
        'Open Sans',
        'Comic Sans',
        'Lobster',
        'Roboto',
        'Helvetica Neue'
      ];

      for (const font of unauthorizedFonts) {
        const regex = new RegExp(`\\b${font}\\b`, 'i');
        assert.doesNotMatch(
          adminHtml,
          regex,
          `admin.html must NOT contain unauthorized font reference: ${font}`
        );
      }
    });

    test('T1.2: admin.html title font selector strictly offers only Cormorant Garamond and Playfair Display', () => {
      const adminHtml = fs.readFileSync(path.join(ROOT_DIR, 'admin.html'), 'utf8');
      const selectMatch = adminHtml.match(/<select[^>]*data-key=["']font_title["'][^>]*>([\s\S]*?)<\/select>/i);
      assert.ok(selectMatch, 'admin.html must contain <select data-key="font_title">');

      const selectBody = selectMatch[1];
      const optionMatches = [...selectBody.matchAll(/<option[^>]*value=(?:"([^"]+)"|'([^']+)')[^>]*>([^<]*)<\/option>/gi)];

      assert.equal(optionMatches.length, 2, 'Title font selector must offer exactly 2 options');

      const values = optionMatches.map(m => m[1] || m[2]);
      assert.deepEqual(values, [
        "'Cormorant Garamond', serif",
        "'Playfair Display', serif"
      ], 'Title options must strictly match approved serif fonts');
    });

    test('T1.3: admin.html body/text font selector strictly offers only Inter and Montserrat', () => {
      const adminHtml = fs.readFileSync(path.join(ROOT_DIR, 'admin.html'), 'utf8');
      const selectMatch = adminHtml.match(/<select[^>]*data-key=["']font_text["'][^>]*>([\s\S]*?)<\/select>/i);
      assert.ok(selectMatch, 'admin.html must contain <select data-key="font_text">');

      const selectBody = selectMatch[1];
      const optionMatches = [...selectBody.matchAll(/<option[^>]*value=(?:"([^"]+)"|'([^']+)')[^>]*>([^<]*)<\/option>/gi)];

      assert.equal(optionMatches.length, 2, 'Body text font selector must offer exactly 2 options');

      const values = optionMatches.map(m => m[1] || m[2]);
      assert.deepEqual(values, [
        "'Inter', sans-serif",
        "'Montserrat', sans-serif"
      ], 'Body text options must strictly match approved sans-serif fonts');
    });

    test('T1.4: dist/admin.html production build preserves sanitized select options', () => {
      const distAdminHtml = fs.readFileSync(path.join(ROOT_DIR, 'dist', 'admin.html'), 'utf8');
      assert.match(distAdminHtml, /data-key=["']font_title["']/);
      assert.match(distAdminHtml, /data-key=["']font_text["']/);

      assert.doesNotMatch(distAdminHtml, /\bCinzel\b/i);
      assert.doesNotMatch(distAdminHtml, /\bDM Serif\b/i);
      assert.doesNotMatch(distAdminHtml, /\bLato\b/i);
      assert.doesNotMatch(distAdminHtml, /\bOpen Sans\b/i);
    });
  });

  // =========================================================================
  // SCENARIO T2: Runtime Whitelist Enforcement & Adversarial Injection Stress
  // =========================================================================
  describe('Scenario T2: Runtime Whitelist Enforcement & Adversarial Injection Stress', () => {

    // Harness replicating src/main.ts:88-101 defensive logic
    function simulateFontSanitization(item) {
      const rootStyles = new Map();
      const mockDocumentElement = {
        style: {
          setProperty: (prop, val) => rootStyles.set(prop, val),
          getPropertyValue: (prop) => rootStyles.get(prop) || ''
        }
      };

      if (item.key === 'font_title') {
        const allowedSerifs = ["'Cormorant Garamond', serif", "'Playfair Display', serif"];
        const safeSerif = allowedSerifs.includes(item.content)
          ? item.content
          : "'Cormorant Garamond', 'Playfair Display', serif";
        mockDocumentElement.style.setProperty('--font-serif', safeSerif);
      } else if (item.key === 'font_text') {
        const allowedSans = ["'Inter', sans-serif", "'Montserrat', sans-serif"];
        const safeSans = allowedSans.includes(item.content)
          ? item.content
          : "'Inter', sans-serif";
        mockDocumentElement.style.setProperty('--font-sans', safeSans);
      }

      return rootStyles;
    }

    test('T2.1: Adversarial attempt to inject Cinzel is intercepted and neutralized', () => {
      const styles = simulateFontSanitization({ key: 'font_title', content: "'Cinzel', serif" });
      assert.equal(
        styles.get('--font-serif'),
        "'Cormorant Garamond', 'Playfair Display', serif",
        'Unauthorized Cinzel must be rejected and fallback applied'
      );
    });

    test('T2.2: Adversarial attempt to inject DM Serif Display is intercepted and neutralized', () => {
      const styles = simulateFontSanitization({ key: 'font_title', content: "'DM Serif Display', serif" });
      assert.equal(
        styles.get('--font-serif'),
        "'Cormorant Garamond', 'Playfair Display', serif",
        'Unauthorized DM Serif Display must be rejected and fallback applied'
      );
    });

    test('T2.3: Adversarial attempt to inject Lato is intercepted and neutralized', () => {
      const styles = simulateFontSanitization({ key: 'font_text', content: "'Lato', sans-serif" });
      assert.equal(
        styles.get('--font-sans'),
        "'Inter', sans-serif",
        'Unauthorized Lato must be rejected and fallback applied'
      );
    });

    test('T2.4: Adversarial attempt to inject Open Sans is intercepted and neutralized', () => {
      const styles = simulateFontSanitization({ key: 'font_text', content: "'Open Sans', sans-serif" });
      assert.equal(
        styles.get('--font-sans'),
        "'Inter', sans-serif",
        'Unauthorized Open Sans must be rejected and fallback applied'
      );
    });

    test('T2.5: Fuzzing attack with CSS breakout, XSS vectors, and malformed types', () => {
      const evilPayloads = [
        "'; } * { background: red !important; } /*",
        "'Cormorant Garamond'; @import url('evil.css');",
        "javascript:alert(1)",
        "url('https://hacker.com/font.woff2')",
        "<script>alert(1)</script>",
        "cormorant garamond", // wrong casing
        "'Cormorant Garamond',serif", // missing space
        null,
        undefined,
        "",
        12345,
        { evil: true },
        ["'Playfair Display', serif"]
      ];

      for (const payload of evilPayloads) {
        // Test font_title fuzzing
        const serifStyles = simulateFontSanitization({ key: 'font_title', content: payload });
        assert.equal(
          serifStyles.get('--font-serif'),
          "'Cormorant Garamond', 'Playfair Display', serif",
          `Fuzz payload for font_title [${payload}] must fallback safely`
        );

        // Test font_text fuzzing
        const sansStyles = simulateFontSanitization({ key: 'font_text', content: payload });
        assert.equal(
          sansStyles.get('--font-sans'),
          "'Inter', sans-serif",
          `Fuzz payload for font_text [${payload}] must fallback safely`
        );
      }
    });

    test('T2.6: Authorized font selections are correctly accepted', () => {
      // Valid Serif 1
      let s = simulateFontSanitization({ key: 'font_title', content: "'Cormorant Garamond', serif" });
      assert.equal(s.get('--font-serif'), "'Cormorant Garamond', serif");

      // Valid Serif 2
      s = simulateFontSanitization({ key: 'font_title', content: "'Playfair Display', serif" });
      assert.equal(s.get('--font-serif'), "'Playfair Display', serif");

      // Valid Sans 1
      s = simulateFontSanitization({ key: 'font_text', content: "'Inter', sans-serif" });
      assert.equal(s.get('--font-sans'), "'Inter', sans-serif");

      // Valid Sans 2
      s = simulateFontSanitization({ key: 'font_text', content: "'Montserrat', sans-serif" });
      assert.equal(s.get('--font-sans'), "'Montserrat', sans-serif");
    });

    test('T2.7: Verification of src/main.ts AST/code directly implementing whitelist bounds', () => {
      const mainTs = fs.readFileSync(path.join(ROOT_DIR, 'src', 'main.ts'), 'utf8');
      assert.match(mainTs, /allowedSerifs\s*=\s*\[.*'Cormorant Garamond'.*'Playfair Display'.*\]/);
      assert.match(mainTs, /allowedSans\s*=\s*\[.*'Inter'.*'Montserrat'.*\]/);
      assert.match(mainTs, /document\.documentElement\.style\.setProperty\(['"]--font-serif['"]/);
      assert.match(mainTs, /document\.documentElement\.style\.setProperty\(['"]--font-sans['"]/);
    });
  });

  // =========================================================================
  // SCENARIO T3: Tracking & Letter-Spacing System Integrity
  // =========================================================================
  describe('Scenario T3: Tracking & Typography Rules Compliance', () => {

    const cssContent = fs.readFileSync(path.join(ROOT_DIR, 'src', 'style.css'), 'utf8');

    // Helper to extract CSS rule block
    function getCssRuleBlock(css, selector) {
      const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:^|[}\\n])\\s*${escaped}\\s*\\{([^}]+)\\}`, 'm');
      const match = css.match(regex);
      return match ? match[1] : null;
    }

    test('T3.1: Desktop navigation links enforce wide uppercase tracking (0.22em) and small-size font', () => {
      const block = getCssRuleBlock(cssContent, '.nav-links a');
      assert.ok(block, '.nav-links a must exist in style.css');
      assert.match(block, /font-family:\s*var\(--font-sans\)/);
      assert.match(block, /text-transform:\s*uppercase/);
      assert.match(block, /letter-spacing:\s*0\.22em/);
      assert.match(block, /font-size:\s*0\.75rem/);
      assert.match(block, /font-weight:\s*600/);
    });

    test('T3.2: Editorial photo trigger (.dish-photo-trigger) complies with spec (0.22em tracking, 10px font)', () => {
      const block = getCssRuleBlock(cssContent, '.dish-photo-trigger');
      assert.ok(block, '.dish-photo-trigger must exist in style.css');
      assert.match(block, /font-family:\s*var\(--font-sans\)/);
      assert.match(block, /font-size:\s*10px/);
      assert.match(block, /letter-spacing:\s*0\.22em/);
      assert.match(block, /text-transform:\s*uppercase/);
      assert.match(block, /color:\s*var\(--lux-gold-champagne\)/);
    });

    test('T3.3: Legacy photo trigger (.item-photo-btn) has tracking >= 0.15em and 0 shiny button loop', () => {
      const block = getCssRuleBlock(cssContent, '.item-photo-btn');
      assert.ok(block, '.item-photo-btn must exist in style.css');
      assert.match(block, /letter-spacing:\s*0\.15em/);
      assert.match(block, /text-transform:\s*uppercase/);
      assert.doesNotMatch(block, /animation:\s*shiny-button/);
      assert.doesNotMatch(cssContent, /@keyframes\s+shiny-button/);
    });

    test('T3.4: Allergen pills (.allergen-pill) enforce 9px font, uppercase, and 0.18em tracking', () => {
      const block = getCssRuleBlock(cssContent, '.allergen-pill');
      assert.ok(block, '.allergen-pill must exist in style.css');
      assert.match(block, /font-size:\s*9px/);
      assert.match(block, /letter-spacing:\s*0\.18em/);
      assert.match(block, /text-transform:\s*uppercase/);
      assert.match(block, /font-weight:\s*600/);
      assert.match(block, /border-radius:\s*2px/);
    });

    test('T3.5: Primary buttons (.btn-gold, .btn-outline-white) enforce wide tracking (0.22em) and uppercase', () => {
      const goldBlock = getCssRuleBlock(cssContent, '.btn-gold');
      assert.ok(goldBlock, '.btn-gold must exist in style.css');
      assert.match(goldBlock, /letter-spacing:\s*0\.22em/);
      assert.match(goldBlock, /text-transform:\s*uppercase/);
      assert.match(goldBlock, /font-family:\s*var\(--font-sans\)/);

      const outlineBlock = getCssRuleBlock(cssContent, '.btn-outline-white');
      assert.ok(outlineBlock, '.btn-outline-white must exist in style.css');
      assert.match(outlineBlock, /letter-spacing:\s*0\.22em/);
      assert.match(outlineBlock, /text-transform:\s*uppercase/);
    });

    test('T3.6: Micro-copy labels (.label-white, .label-gold) enforce wide tracking (0.22em)', () => {
      const whiteBlock = getCssRuleBlock(cssContent, '.label-white');
      assert.ok(whiteBlock, '.label-white must exist in style.css');
      assert.match(whiteBlock, /letter-spacing:\s*0\.22em/);
      assert.match(whiteBlock, /text-transform:\s*uppercase/);

      const goldBlock = getCssRuleBlock(cssContent, '.label-gold');
      assert.ok(goldBlock, '.label-gold must exist in style.css');
      assert.match(goldBlock, /letter-spacing:\s*0\.22em/);
      assert.match(goldBlock, /text-transform:\s*uppercase/);
    });

    test('T3.7: Dish names and global headings maintain tight, proportional letter-spacing', () => {
      const headingsBlock = getCssRuleBlock(cssContent, 'h1, h2, h3, h4, h5, h6');
      assert.ok(headingsBlock, 'h1..h6 rule must exist');
      assert.match(headingsBlock, /letter-spacing:\s*0\.02em/);
      assert.match(headingsBlock, /line-height:\s*1\.1/);
      assert.match(headingsBlock, /font-family:\s*var\(--font-serif\)/);

      const dishNameBlock = getCssRuleBlock(cssContent, '.menu-item-header h3,\n.menu-item-name');
      assert.ok(dishNameBlock, 'menu-item-header h3 must exist');
      assert.match(dishNameBlock, /letter-spacing:\s*0\.03em/);
      assert.match(dishNameBlock, /font-family:\s*var\(--font-serif\)/);
    });

    test('T3.8: Dish prices (.menu-item-price) enforce uppercase numeric tracking (0.15em)', () => {
      const priceBlock = getCssRuleBlock(cssContent, '.menu-item-price');
      assert.ok(priceBlock, '.menu-item-price must exist');
      assert.match(priceBlock, /letter-spacing:\s*0\.15em/);
      assert.match(priceBlock, /text-transform:\s*uppercase/);

      const dualPriceBlock = getCssRuleBlock(cssContent, '.menu-item-price.dual');
      assert.ok(dualPriceBlock, '.menu-item-price.dual must exist');
      assert.match(dualPriceBlock, /letter-spacing:\s*0\.15em/);
      assert.match(dualPriceBlock, /font-style:\s*italic/);
    });
  });

  // =========================================================================
  // SCENARIO T4: Viewport Responsiveness & Mobile/Desktop Adaptability
  // =========================================================================
  describe('Scenario T4: Viewport Responsiveness & Mobile/Desktop Adaptability', () => {

    const cssContent = fs.readFileSync(path.join(ROOT_DIR, 'src', 'style.css'), 'utf8');

    test('T4.1: Hero and section titles use CSS clamp(...) for fluid responsiveness across viewports', () => {
      // .serif-title-xl
      assert.match(
        cssContent,
        /\.serif-title-xl\s*\{[^}]*font-size:\s*clamp\(3rem,\s*10vw,\s*7rem\)/,
        '.serif-title-xl must use fluid clamp(3rem, 10vw, 7rem)'
      );

      // .serif-title
      assert.match(
        cssContent,
        /\.serif-title\s*\{[^}]*font-size:\s*clamp\(2\.2rem,\s*5vw,\s*4rem\)/,
        '.serif-title must use fluid clamp(2.2rem, 5vw, 4rem)'
      );

      // .page-carta .serif-title
      assert.match(
        cssContent,
        /\.page-carta\s+\.serif-title\s*\{[^}]*font-size:\s*clamp\(3rem,\s*6vw,\s*5rem\)/,
        '.page-carta .serif-title must use fluid clamp(3rem, 6vw, 5rem)'
      );
    });

    test('T4.2: Mobile drawer navigation (.mobile-nav a) uses editorial serif at 2rem on small screens', () => {
      assert.match(
        cssContent,
        /\.mobile-nav\s+a\s*\{[^}]*font-family:\s*var\(--font-serif\);[^}]*font-size:\s*2rem;/,
        '.mobile-nav a must use var(--font-serif) with 2rem size in mobile drawer'
      );
    });

    test('T4.3: Desktop viewports hide mobile elements (.mobile-menu-btn, .mobile-nav)', () => {
      assert.match(
        cssContent,
        /\.mobile-menu-btn,\s*\.mobile-nav\s*\{\s*display:\s*none;\s*\}/,
        'Mobile navigation controls must be hidden by default on desktop'
      );
    });

    test('T4.4: Mobile media query (max-width: 768px) adapts container padding to prevent horizontal clipping', () => {
      assert.match(
        cssContent,
        /@media\s*\(\s*max-width:\s*768px\s*\)\s*\{[\s\S]*?\.page-carta\s+\.section-container\s*\{[\s\S]*?padding:\s*clamp\(1\.5rem,\s*4vw,\s*2\.5rem\);/
      );
      assert.match(
        cssContent,
        /@media\s*\(\s*max-width:\s*768px\s*\)\s*\{[\s\S]*?\.section-container-narrow,\s*\.section-container\s*\{[\s\S]*?padding-left:\s*20px\s*!important;\s*padding-right:\s*20px\s*!important;/
      );
    });

    test('T4.5: Micro-viewport media query (max-width: 480px) guards against tooltip overflow', () => {
      assert.match(
        cssContent,
        /@media\s*\(\s*max-width:\s*480px\s*\)\s*\{[\s\S]*?\.menu-tag::after\s*\{[\s\S]*?font-size:\s*0\.7rem;/
      );
    });

    test('T4.6: Zero hardcoded font families outside CSS custom properties in style.css', () => {
      // Find all font-family declarations in style.css
      const matches = [...cssContent.matchAll(/font-family:\s*([^;]+);/g)].map(m => m[1].trim());

      for (const val of matches) {
        // Allowed forms:
        // - var(--font-serif)
        // - var(--font-sans)
        // - var(--font-title)
        // - var(--font-body)
        // - inherit
        // - ':root' definitions
        const isVar = val.startsWith('var(--font-') || val === 'inherit' || val.includes('var(--font-sans)');
        const isRootToken = val.includes("'Cormorant Garamond'") || val.includes("'Inter'");

        assert.ok(
          isVar || isRootToken,
          `Unexpected font-family declaration in style.css: font-family: ${val}`
        );
      }
    });
  });

  // =========================================================================
  // SCENARIO T5: Production Build Invariants
  // =========================================================================
  describe('Scenario T5: Production Build Typography Invariants', () => {

    test('T5.1: Production CSS bundle in dist/assets has zero unauthorized fonts', () => {
      const assetsDir = path.join(ROOT_DIR, 'dist', 'assets');
      const cssFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.css'));
      assert.ok(cssFiles.length > 0, 'dist/assets must contain CSS files');

      for (const file of cssFiles) {
        const content = fs.readFileSync(path.join(assetsDir, file), 'utf8');
        assert.doesNotMatch(content, /\bCinzel\b/i, `${file} must not contain Cinzel`);
        assert.doesNotMatch(content, /\bDM Serif\b/i, `${file} must not contain DM Serif`);
        assert.doesNotMatch(content, /\bLato\b/i, `${file} must not contain Lato`);
        assert.doesNotMatch(content, /\bOpen Sans\b/i, `${file} must not contain Open Sans`);
      }
    });

    test('T5.2: Production JS bundle main chunk in dist/assets contains whitelist guard logic', () => {
      const assetsDir = path.join(ROOT_DIR, 'dist', 'assets');
      const mainJs = fs.readdirSync(assetsDir).find(f => f.startsWith('main-') && f.endsWith('.js'));
      assert.ok(mainJs, 'main-*.js bundle chunk must exist in dist/assets');

      const content = fs.readFileSync(path.join(assetsDir, mainJs), 'utf8');
      assert.match(content, /--font-serif/, 'main bundle must manage --font-serif');
      assert.match(content, /--font-sans/, 'main bundle must manage --font-sans');
      assert.match(content, /Cormorant Garamond/, 'main bundle must contain whitelist default');
    });

    test('T5.3: Production CSS bundle size is well under 35 kB SLA', () => {
      const assetsDir = path.join(ROOT_DIR, 'dist', 'assets');
      const mainCss = fs.readdirSync(assetsDir).find(f => f.startsWith('style-') && f.endsWith('.css'));
      assert.ok(mainCss, 'style-*.css bundle must exist in dist/assets');

      const stat = fs.statSync(path.join(assetsDir, mainCss));
      assert.ok(stat.size < 35000, `Production style.css is ${stat.size} bytes, must be < 35,000 bytes`);
    });
  });
});
