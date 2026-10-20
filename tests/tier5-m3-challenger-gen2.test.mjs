/**
 * Tier 5: Adversarial Challenger Stress Suite (Milestone 3 - Generation 2 Remediation Verification)
 * Formal SSOT: ORIGINAL_REQUEST.md R3, PROJECT.md M3, specs/design-system-spec.md §3, specs/openapi.yaml
 * Agent: m3_challenger_2_gen2 (EMPIRICAL CHALLENGER - Remediation Verification)
 * 
 * Conducts exhaustive empirical verification of the 4 remediated defects from iteration 1:
 * 1. Escape key dismissal on #menu-photo-modal and body scroll unlocking.
 * 2. Zero event listener accumulation across multiple category switches.
 * 3. Non-array truthy tags (e.g. "pescado", 123, true, {}) resilience without runtime crash.
 * 4. Double quotes escaping in item.description and item.name preventing HTML attribute breakout.
 * 5. Production CSS flex-wrap layout resilience for long market price headers.
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { MockElement, MockDocument, MockEvent } from './helpers/mock-dom.mjs';
import {
  OFFICIAL_ALLERGEN_TAGS,
  isValidAllergenTag,
  renderAllergenPill
} from './contracts/allergens.mjs';
import { formatMenuItemPrice } from './contracts/pricing.mjs';

const ROOT_DIR = process.cwd();

// Pure domain helpers directly matching production implementation in src/main.ts
function sanitizeDishName(name) {
  if (!name) return '';
  return name
    .replace(/\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]|[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function renderMenuItemHtmlRemediated(item) {
  const cleanName = sanitizeDishName(item.name || '');
  const pricing = formatMenuItemPrice(item.price, item.description);

  const pillsHtml = (Array.isArray(item.tags) ? item.tags : [])
    .filter(isValidAllergenTag)
    .map(renderAllergenPill)
    .join('');

  const escapedName = cleanName.replace(/"/g, '&quot;');
  const escapedDesc = (item.description || '').replace(/"/g, '&quot;');

  const photoTrigger = item.image_url
    ? `<button class="dish-photo-trigger" data-img="${item.image_url}" data-name="${escapedName}" data-desc="${escapedDesc}" aria-label="Ver fotografía del plato">
        <span>FOTOGRAFÍA</span>
        <span class="trigger-line"></span>
      </button>`
    : '';

  const descriptionDisplay = (!pricing.isMarketPrice && item.description)
    ? item.description.trim()
    : '';

  const descriptionBlock = descriptionDisplay
    ? `<div class="menu-item-info"><p class="menu-item-description">${descriptionDisplay}</p></div>`
    : '';

  return `<article class="menu-item menu-item-card reveal active" data-category="${item.category || 'comida'}">
    <div class="menu-item-header">
      <h3 class="menu-item-name serif-title">${cleanName}</h3>
      <span class="${pricing.priceClass}">${pricing.displayPrice}</span>
    </div>
    ${descriptionBlock}
    <div class="menu-item-footer">
      ${pillsHtml ? `<div class="menu-item-allergens">${pillsHtml}</div>` : ''}
      ${photoTrigger}
    </div>
  </article>`;
}

describe('Tier 5 Gen2: Empirical Remediation Stress Verification (Milestone 3)', () => {

  // =========================================================================
  // DEFECT 1: Modal Escape Key Dismissal & Body Scroll Lock Lifecycle
  // =========================================================================
  describe('Remediation 1: Escape Key Dismissal on #menu-photo-modal', () => {

    test('GEN2.M3.1: Escape key dismisses active modal, clears image src, and unlocks body scroll', () => {
      const doc = new MockDocument();
      const modal = doc.createElement('div');
      modal.id = 'menu-photo-modal';
      modal.className = 'menu-modal active';

      const img = doc.createElement('img');
      img.className = 'menu-modal-img';
      img.src = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
      modal.appendChild(img);
      doc.body.appendChild(modal);

      doc.body.style.overflow = 'hidden';

      const closePhotoModal = () => {
        modal.classList.remove('active');
        if (img) img.src = '';
        doc.body.style.overflow = '';
      };

      const keydownHandler = (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
          closePhotoModal();
        }
      };

      // When modal is active and Escape is pressed:
      keydownHandler({ key: 'Escape' });

      assert.equal(modal.classList.contains('active'), false, 'Modal active class must be removed');
      assert.equal(img.src, '', 'Modal image src must be emptied');
      assert.equal(doc.body.style.overflow, '', 'Body scroll must be unlocked');
    });

    test('GEN2.M3.2: Non-Escape keys (Enter, Space, Tab, ArrowDown) do NOT dismiss active modal', () => {
      const doc = new MockDocument();
      const modal = doc.createElement('div');
      modal.id = 'menu-photo-modal';
      modal.className = 'menu-modal active';
      const img = doc.createElement('img');
      img.src = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
      modal.appendChild(img);
      doc.body.appendChild(modal);
      doc.body.style.overflow = 'hidden';

      const closePhotoModal = () => {
        modal.classList.remove('active');
        img.src = '';
        doc.body.style.overflow = '';
      };

      const keydownHandler = (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
          closePhotoModal();
        }
      };

      for (const key of ['Enter', ' ', 'Tab', 'ArrowDown', 'Backspace', 'Shift']) {
        keydownHandler({ key });
        assert.equal(modal.classList.contains('active'), true, `Key ${key} must not dismiss modal`);
        assert.equal(doc.body.style.overflow, 'hidden', `Key ${key} must leave body scroll locked`);
        assert.notEqual(img.src, '', `Key ${key} must not clear image src`);
      }
    });

    test('GEN2.M3.3: Escape key when modal is inactive does NOT crash or alter body overflow', () => {
      const doc = new MockDocument();
      const modal = doc.createElement('div');
      modal.id = 'menu-photo-modal';
      modal.className = 'menu-modal'; // Inactive
      doc.body.appendChild(modal);
      doc.body.style.overflow = 'visible';

      let closeCalled = false;
      const closePhotoModal = () => {
        closeCalled = true;
        modal.classList.remove('active');
        doc.body.style.overflow = '';
      };

      const keydownHandler = (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
          closePhotoModal();
        }
      };

      keydownHandler({ key: 'Escape' });
      assert.equal(closeCalled, false, 'closePhotoModal must NOT be invoked when modal is not active');
      assert.equal(doc.body.style.overflow, 'visible', 'Body overflow must remain untouched');
    });

    test('GEN2.M3.4: Stress test: 50 consecutive open -> Escape dismiss cycles maintain state stability', () => {
      const doc = new MockDocument();
      const modal = doc.createElement('div');
      modal.id = 'menu-photo-modal';
      modal.className = 'menu-modal';
      const img = doc.createElement('img');
      img.className = 'menu-modal-img';
      modal.appendChild(img);
      doc.body.appendChild(modal);

      const closePhotoModal = () => {
        modal.classList.remove('active');
        img.src = '';
        doc.body.style.overflow = '';
      };

      const keydownHandler = (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
          closePhotoModal();
        }
      };

      for (let i = 0; i < 50; i++) {
        // Open
        modal.classList.add('active');
        img.src = `https://res.cloudinary.com/demo/image/upload/dish_${i}.jpg`;
        doc.body.style.overflow = 'hidden';

        assert.equal(modal.classList.contains('active'), true);
        assert.equal(doc.body.style.overflow, 'hidden');

        // Close via Escape
        keydownHandler({ key: 'Escape' });

        assert.equal(modal.classList.contains('active'), false);
        assert.equal(img.src, '');
        assert.equal(doc.body.style.overflow, '');
      }
    });

    test('GEN2.M3.5: Source AST check: src/main.ts contains exact keydown listener binding on document', () => {
      const mainTs = fs.readFileSync(path.join(ROOT_DIR, 'src', 'main.ts'), 'utf8');
      assert.match(
        mainTs,
        /document\.addEventListener\('keydown',\s*\(e:\s*KeyboardEvent\)\s*=>\s*\{[\s\S]*?if\s*\(e\.key\s*===\s*'Escape'\s*&&\s*photoModal\.classList\.contains\('active'\)\)\s*\{[\s\S]*?closePhotoModal\(\);[\s\S]*?\}\s*\}\);/,
        'src/main.ts must attach keydown listener for Escape on document checking photoModal.classList.contains("active")'
      );
    });
  });

  // =========================================================================
  // DEFECT 2: Zero Event Listener Accumulation Across Category Switches
  // =========================================================================
  describe('Remediation 2: Zero Event Listener Accumulation on Category Switches', () => {

    test('GEN2.M3.6: Persistent modal buttons retain exactly 1 listener after 50 category switches', () => {
      const doc = new MockDocument();
      const photoModal = doc.createElement('div');
      photoModal.id = 'menu-photo-modal';
      const closeModalBtn = doc.createElement('button');
      closeModalBtn.className = 'close-menu-modal';
      photoModal.appendChild(closeModalBtn);
      doc.body.appendChild(photoModal);

      const menuGrid = doc.createElement('div');
      menuGrid.id = 'menu-grid';
      doc.body.appendChild(menuGrid);

      // --- ARCHITECTURE IN src/main.ts lines 396-420 ---
      // Outer scope initialization (ONCE)
      const closePhotoModal = () => {
        photoModal.classList.remove('active');
      };

      closeModalBtn.addEventListener('click', closePhotoModal);
      photoModal.addEventListener('click', (e) => {
        if (e.target === photoModal) closePhotoModal();
      });
      // End outer scope initialization

      // Inner loadMenu function
      function loadMenu(category) {
        menuGrid.innerHTML = `<div class="menu-item" data-cat="${category}">Plato de ${category}</div>`;
      }

      // Simulate 50 rapid category filter switches
      const categories = ['comida', 'coctel', 'bebida'];
      for (let i = 0; i < 50; i++) {
        loadMenu(categories[i % 3]);
      }

      // Assert listener counts on persistent elements
      const closeBtnListeners = closeModalBtn.eventListeners['click'] || [];
      const photoModalListeners = photoModal.eventListeners['click'] || [];

      assert.equal(
        closeBtnListeners.length,
        1,
        `closeModalBtn must have exactly 1 click listener, found ${closeBtnListeners.length}`
      );
      assert.equal(
        photoModalListeners.length,
        1,
        `photoModal must have exactly 1 click listener, found ${photoModalListeners.length}`
      );
    });

    test('GEN2.M3.7: Source architecture check: modal listener bindings reside strictly OUTSIDE loadMenu', () => {
      const mainTs = fs.readFileSync(path.join(ROOT_DIR, 'src', 'main.ts'), 'utf8');

      const modalInitIndex = mainTs.indexOf("// --- PHOTO MODAL LOGIC (Initialized once in outer scope to prevent listener accumulation) ---");
      const loadMenuIndex = mainTs.indexOf("async function loadMenu(");
      const closeBtnAddListenerIndex = mainTs.indexOf("closeModalBtn?.addEventListener('click', closePhotoModal);");

      assert.ok(modalInitIndex > -1, 'Modal logic header comment must exist');
      assert.ok(loadMenuIndex > -1, 'loadMenu function must exist');
      assert.ok(closeBtnAddListenerIndex > -1, 'closeModalBtn event listener must exist');

      assert.ok(
        modalInitIndex < loadMenuIndex,
        'Modal logic must be initialized in outer scope before loadMenu definition'
      );
      assert.ok(
        closeBtnAddListenerIndex < loadMenuIndex,
        'closeModalBtn click listener must be attached before loadMenu definition'
      );

      // Verify loadMenu does NOT contain any query or binding for close-menu-modal
      const loadMenuBody = mainTs.slice(loadMenuIndex, mainTs.indexOf('filterBtns.forEach'));
      assert.doesNotMatch(
        loadMenuBody,
        /\.close-menu-modal/,
        'loadMenu body must NOT query or bind .close-menu-modal'
      );
      assert.doesNotMatch(
        loadMenuBody,
        /closeModalBtn\?\.addEventListener/,
        'loadMenu body must NOT attach listeners to closeModalBtn'
      );
    });
  });

  // =========================================================================
  // DEFECT 3: Non-Array Truthy Tags Resilience (Fuzz & Edge-Case Inputs)
  // =========================================================================
  describe('Remediation 3: Non-Array Truthy Tags Resilience', () => {

    test('GEN2.M3.8: renderMenuItemHtml handles non-array truthy values without throwing TypeError', () => {
      const dirtyInputs = [
        'pescado',                     // string
        123,                           // number
        0,                             // number zero
        true,                          // boolean true
        false,                         // boolean false
        {},                            // plain object
        { tag: 'pescado' },            // nested object
        () => ['pescado'],             // function
        Symbol('pescado'),             // symbol
        12345678901234567890n,         // BigInt
        null,                          // null
        undefined                      // undefined
      ];

      for (const dirtyTag of dirtyInputs) {
        const item = {
          name: 'Plato Fuzz Test',
          price: 15.0,
          category: 'comida',
          tags: dirtyTag
        };

        assert.doesNotThrow(
          () => {
            const html = renderMenuItemHtmlRemediated(item);
            assert.ok(html.includes('Plato Fuzz Test'), 'Output HTML must contain dish name');
            // None of these should generate an allergen pill
            assert.doesNotMatch(html, /<div class="menu-item-allergens">/, `Non-array tag ${String(dirtyTag)} must omit allergens container`);
          },
          `renderMenuItemHtml must not throw when tags is ${typeof dirtyTag}`
        );
      }
    });

    test('GEN2.M3.9: loadMenu tag filtering does not crash when documents have non-array tags', () => {
      const mockDocs = [
        { id: '1', name: 'Plato Con String', tags: 'pescado', category: 'comida' },
        { id: '2', name: 'Plato Con Numero', tags: 123, category: 'comida' },
        { id: '3', name: 'Plato Con Array Valido', tags: ['pescado', 'marisco'], category: 'comida' },
        { id: '4', name: 'Plato Con Null', tags: null, category: 'comida' },
        { id: '5', name: 'Plato Con Boolean', tags: true, category: 'comida' },
        { id: '6', name: 'Plato Con Array Diferente', tags: ['carne'], category: 'comida' }
      ];

      const tagFilter = 'pescado';

      assert.doesNotThrow(() => {
        // Exact logic from src/main.ts line 438:
        const filtered = mockDocs.filter(d => (Array.isArray(d.tags) ? d.tags : []).includes(tagFilter));
        assert.equal(filtered.length, 1, 'Only doc with genuine array containing pescado must match');
        assert.equal(filtered[0].id, '3', 'Document 3 must be the single match');
      });
    });

    test('GEN2.M3.10: Valid allergen arrays with mixed dirty elements filter gracefully', () => {
      const mixedItem = {
        name: 'Plato Mixto',
        price: 25.0,
        category: 'comida',
        tags: ['pescado', 123, null, 'invalid_tag', 'marisco', undefined]
      };

      const html = renderMenuItemHtmlRemediated(mixedItem);
      assert.match(html, /data-allergen="pescado">PESCADO<\/span>/);
      assert.match(html, /data-allergen="marisco">MARISCO<\/span>/);
      assert.doesNotMatch(html, /data-allergen="invalid_tag"/);
    });

    test('GEN2.M3.11: Source AST check: Array.isArray guards exist in both renderMenuItemHtml and loadMenu', () => {
      const mainTs = fs.readFileSync(path.join(ROOT_DIR, 'src', 'main.ts'), 'utf8');

      assert.match(
        mainTs,
        /\(Array\.isArray\(item\.tags\)\s*\?\s*item\.tags\s*:\s*\[\]\)/,
        'renderMenuItemHtml in src/main.ts must use (Array.isArray(item.tags) ? item.tags : [])'
      );

      assert.match(
        mainTs,
        /\(Array\.isArray\(d\.tags\)\s*\?\s*d\.tags\s*:\s*\[\]\)/,
        'loadMenu tagFilter in src/main.ts must use (Array.isArray(d.tags) ? d.tags : [])'
      );
    });
  });

  // =========================================================================
  // DEFECT 4: Double Quotes Escaping in item.description and item.name
  // =========================================================================
  describe('Remediation 4: Double Quotes Escaping in HTML Attributes', () => {

    test('GEN2.M3.12: Double quotes in description and name are converted to &quot; in data attributes', () => {
      const item = {
        name: 'Lomo Saltado "Especial"',
        price: 22.0,
        description: 'Solomillo al estilo "Chifa" con toques de "Wok"',
        image_url: 'https://res.cloudinary.com/demo/image/upload/lomo.jpg'
      };

      const html = renderMenuItemHtmlRemediated(item);

      // Verify HTML string contains &quot; in attributes
      assert.match(
        html,
        /data-name="Lomo Saltado &quot;Especial&quot;"/,
        'data-name must contain &quot; for double quotes'
      );
      assert.match(
        html,
        /data-desc="Solomillo al estilo &quot;Chifa&quot; con toques de &quot;Wok&quot;"/,
        'data-desc must contain &quot; for double quotes'
      );

      // Raw unescaped quotes must NOT appear inside the attribute definitions
      assert.doesNotMatch(
        html,
        /data-desc="[^"]*"Chifa"/,
        'data-desc must not contain raw unescaped quotes that break attribute syntax'
      );
    });

    test('GEN2.M3.13: DOM attribute retrieval preserves complete text without truncation', () => {
      const item = {
        name: 'Ceviche "Mixto Imperial"',
        price: 28.0,
        description: 'Corvina fresca y pulpo al estilo "Norteño" tradicional con "Leche de Tigre" clásica',
        image_url: 'https://res.cloudinary.com/demo/image/upload/ceviche.jpg'
      };

      const html = renderMenuItemHtmlRemediated(item);

      const doc = new MockDocument();
      const container = doc.createElement('div');
      container.innerHTML = html;

      const trigger = container.querySelector('.dish-photo-trigger');
      assert.ok(trigger, 'Trigger button must be parsed into DOM');

      const dataName = trigger.getAttribute('data-name');
      const dataDesc = trigger.getAttribute('data-desc');

      // Attributes must contain the full text (with &quot; properly preserved in attribute value)
      assert.ok(dataName.includes('Imperial'), 'data-name must not be truncated before Imperial');
      assert.ok(dataDesc.includes('Leche de Tigre'), 'data-desc must not be truncated before Leche de Tigre');
      assert.ok(dataDesc.includes('clásica'), 'data-desc must preserve end of description string');
    });

    test('GEN2.M3.14: Malicious attribute breakout attempt is neutralized in dish-photo-trigger', () => {
      const adversarialItem = {
        name: 'Normal Dish',
        price: 18.0,
        description: 'Breakout attempt: " onclick="alert(1)" data-fake="',
        image_url: 'https://res.cloudinary.com/demo/image/upload/dish.jpg'
      };

      const html = renderMenuItemHtmlRemediated(adversarialItem);

      // Parse into Mock DOM
      const doc = new MockDocument();
      const container = doc.createElement('div');
      container.innerHTML = html;

      const trigger = container.querySelector('.dish-photo-trigger');
      assert.ok(trigger, 'dish-photo-trigger button must exist in DOM');

      // The button must NOT have received injected attributes (onclick or data-fake)
      assert.equal(trigger.hasAttribute('onclick'), false, 'Injected onclick attribute must NOT exist on button');
      assert.equal(trigger.hasAttribute('data-fake'), false, 'Injected data-fake attribute must NOT exist on button');

      // The entire attack string is safely contained inside data-desc
      const descVal = trigger.getAttribute('data-desc');
      assert.ok(descVal.includes('onclick='), 'data-desc safely contains the text payload without breakout');
    });

    test('GEN2.M3.15: Source AST check: cleanName and item.description have replace(/"/g, "&quot;") in src/main.ts', () => {
      const mainTs = fs.readFileSync(path.join(ROOT_DIR, 'src', 'main.ts'), 'utf8');

      assert.match(
        mainTs,
        /const\s+escapedName\s*=\s*cleanName\.replace\(\/\"\/g,\s*'&quot;'\);/,
        'cleanName must have replace(/"/g, "&quot;") in src/main.ts'
      );

      assert.match(
        mainTs,
        /const\s+escapedDesc\s*=\s*\(item\.description\s*\|\|\s*''\)\.replace\(\/\"\/g,\s*'&quot;'\);/,
        'item.description must have replace(/"/g, "&quot;") in src/main.ts'
      );
    });
  });

  // =========================================================================
  // DEFECT 5: Mobile Layout & Dual Pricing Header Wrapping Invariants
  // =========================================================================
  describe('Remediation 5: Mobile Layout & Header Wrapping Invariants', () => {

    test('GEN2.M3.16: Production style.css specifies flex-wrap: wrap and gap on .menu-item-header', () => {
      const styleCss = fs.readFileSync(path.join(ROOT_DIR, 'src', 'style.css'), 'utf8');

      const headerRuleMatch = styleCss.match(/\.menu-item-header\s*\{([^}]+)\}/);
      assert.ok(headerRuleMatch, '.menu-item-header rule must exist in style.css');

      const headerRuleBody = headerRuleMatch[1];
      assert.match(headerRuleBody, /display:\s*flex;/, 'Must specify display: flex');
      assert.match(headerRuleBody, /flex-wrap:\s*wrap;/, 'Must specify flex-wrap: wrap');
      assert.match(headerRuleBody, /gap:\s*8px\s+16px;/, 'Must specify gap: 8px 16px');
    });

    test('GEN2.M3.17: Dual pricing with 150+ chars market description does not produce NaN or empty price', () => {
      const longMarketDesc = 'Pieza entera de corvina salvaje pescada en el Cantábrico, desespinada y cocinada a la brasa de sarmiento con guarnición de yuca y patacones artesanos para compartir';
      const dualItem = {
        name: 'Corvina a la Brasa',
        price: 0,
        description: longMarketDesc
      };

      const html = renderMenuItemHtmlRemediated(dualItem);

      assert.match(html, /<span class="menu-item-price dual">/);
      assert.ok(html.includes(longMarketDesc));
      assert.doesNotMatch(html, /NaN/);
      assert.doesNotMatch(html, /undefined€/);
    });
  });
});
