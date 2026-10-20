/**
 * Tier 5: Adversarial Challenger Stress Suite (Milestone 3)
 * Formal SSOT: ORIGINAL_REQUEST.md R3, PROJECT.md M3, specs/design-system-spec.md §3, specs/openapi.yaml
 * Agent: m3_challenger_2 (EMPIRICAL CHALLENGER - DOM & Behavioral Stress Testing)
 * 
 * Conducts empirical behavioral stress testing on Milestone 3:
 * 1. Scenario C1: Menu filtering and category transitions (switching between comida, coctel, bebida, tag filtering, listener accumulation)
 * 2. Scenario C2: Photo modal lifecycle (opening via .dish-photo-trigger, Cloudinary URL transformation, backdrop/button close, and escape key audit)
 * 3. Scenario C3: Edge-case inputs in renderMenuItemHtml (dirty strings with emojis, dishes with 0 tags, invalid tags, non-array tags crash vulnerability, long market price descriptions, attribute quote breakout)
 * 4. Scenario C4: Static hygiene, design tokens, and pipeline build SLA
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

// Pure domain helpers mirroring src/main.ts
function sanitizeDishName(name) {
  if (!name) return '';
  return name
    .replace(/\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]|[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function renderMenuItemHtml(item) {
  const cleanName = sanitizeDishName(item.name || '');
  const pricing = formatMenuItemPrice(item.price, item.description);

  const pillsHtml = (item.tags || [])
    .filter(isValidAllergenTag)
    .map(renderAllergenPill)
    .join('');

  const photoTrigger = item.image_url
    ? `<button class="dish-photo-trigger" data-img="${item.image_url}" data-name="${cleanName}" data-desc="${item.description || ''}" aria-label="Ver fotografía del plato">
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

// Cloudinary URL transform logic mirroring src/main.ts lines 459-466
function transformCloudinaryUrl(imgUrl) {
  let finalUrl = imgUrl;
  if (finalUrl && finalUrl.includes('cloudinary')) {
    if (finalUrl.includes('f_auto,q_auto') && !finalUrl.includes('w_')) {
      finalUrl = finalUrl.replace('f_auto,q_auto', 'f_auto,q_auto,w_800,c_limit');
    } else if (!finalUrl.includes('f_auto')) {
      finalUrl = finalUrl.replace('/upload/', '/upload/f_auto,q_auto,w_800,c_limit/');
    }
  }
  return finalUrl;
}

describe('Tier 5: Adversarial Challenger Stress Suite (Milestone 3)', () => {

  // =========================================================================
  // SCENARIO C1: Menu Filtering, Category Transitions & Listener Accumulation
  // =========================================================================
  describe('Scenario C1: Menu Filtering & Category State Transitions', () => {

    const testMenuData = [
      { id: '1', name: 'Ceviche Clásico', category: 'comida', subcategory: 'CEVICHES', sort_order: 1, tags: ['pescado', 'picante'], is_available: true },
      { id: '2', name: 'Tiradito Nikkei', category: 'comida', subcategory: 'CEVICHES', sort_order: 2, tags: ['pescado', 'soja'], is_available: true },
      { id: '3', name: 'Lomo Saltado', category: 'comida', subcategory: 'FONDOS', sort_order: 3, tags: ['carne', 'soja'], is_available: true },
      { id: '4', name: 'Pisco Sour', category: 'coctel', subcategory: 'CLÁSICOS', sort_order: 1, tags: ['huevos'], is_available: true },
      { id: '5', name: 'Chilcano Tradicional', category: 'coctel', subcategory: 'CLÁSICOS', sort_order: 2, tags: [], is_available: true },
      { id: '6', name: 'Inca Kola 330ml', category: 'bebida', subcategory: 'REFRESCOS', sort_order: 1, tags: [], is_available: true },
      { id: '7', name: 'Chicha Morada Casera', category: 'bebida', subcategory: 'REFRESCOS', sort_order: 2, tags: [], is_available: true }
    ];

    test('T5.M3.1: Category switching correctly isolates items for comida, coctel, and bebida', () => {
      const comidaItems = testMenuData.filter(i => i.category === 'comida');
      const coctelItems = testMenuData.filter(i => i.category === 'coctel');
      const bebidaItems = testMenuData.filter(i => i.category === 'bebida');

      assert.equal(comidaItems.length, 3, 'comida should contain exactly 3 items');
      assert.equal(coctelItems.length, 2, 'coctel should contain exactly 2 items');
      assert.equal(bebidaItems.length, 2, 'bebida should contain exactly 2 items');

      assert.ok(comidaItems.every(i => i.category === 'comida'));
      assert.ok(coctelItems.every(i => i.category === 'coctel'));
      assert.ok(bebidaItems.every(i => i.category === 'bebida'));
    });

    test('T5.M3.2: Tag filtering cleanly isolates matching allergen tags across category items', () => {
      const sojaComida = testMenuData.filter(i => i.category === 'comida' && (i.tags || []).includes('soja'));
      assert.equal(sojaComida.length, 2);
      assert.deepEqual(sojaComida.map(i => i.name), ['Tiradito Nikkei', 'Lomo Saltado']);

      const pescadoComida = testMenuData.filter(i => i.category === 'comida' && (i.tags || []).includes('pescado'));
      assert.equal(pescadoComida.length, 2);

      const huevosCoctel = testMenuData.filter(i => i.category === 'coctel' && (i.tags || []).includes('huevos'));
      assert.equal(huevosCoctel.length, 1);
      assert.equal(huevosCoctel[0].name, 'Pisco Sour');
    });

    test('T5.M3.3: Items maintain strict sort_order ascending across subcategory groupings', () => {
      const sortedComida = [...testMenuData.filter(i => i.category === 'comida')].sort((a, b) => a.sort_order - b.sort_order);
      for (let i = 0; i < sortedComida.length - 1; i++) {
        assert.ok(sortedComida[i].sort_order <= sortedComida[i + 1].sort_order);
      }
    });

    test('T5.M3.4: Stress test / Defect reproduction: Repeated category transitions leak event listeners on modal close elements', () => {
      // In src/main.ts lines 443-486, loadMenu registers click listeners on closeModalBtn and photoModal.
      // Because photoModal and closeModalBtn are static elements outside menuGrid, every loadMenu call adds a new listener.
      const persistentModal = new MockElement('div', { id: 'menu-photo-modal' });
      const persistentCloseBtn = new MockElement('button', { class: 'close-menu-modal' });
      persistentModal.appendChild(persistentCloseBtn);

      function simulateLoadMenuRegistration() {
        const closeFunc = () => { persistentModal.classList.remove('active'); };
        persistentCloseBtn.addEventListener('click', closeFunc);
        persistentModal.addEventListener('click', (e) => {
          if (e.target === persistentModal) closeFunc();
        });
      }

      // Transition across categories: comida -> bebida -> coctel -> comida -> bebida (5 switches)
      for (let i = 0; i < 5; i++) {
        simulateLoadMenuRegistration();
      }

      const closeListeners = persistentCloseBtn.eventListeners['click'] || [];
      const modalListeners = persistentModal.eventListeners['click'] || [];

      // Defect verified: 5 duplicate listener functions accumulated on persistent close button
      assert.equal(
        closeListeners.length,
        5,
        'Defect confirmed: persistent closeModalBtn accumulated 5 redundant event listeners across 5 category transitions'
      );
      assert.equal(
        modalListeners.length,
        5,
        'Defect confirmed: persistent photoModal accumulated 5 redundant backdrop listeners across 5 category transitions'
      );
    });
  });

  // =========================================================================
  // SCENARIO C2: Photo Modal Lifecycle, Transformations & Dismissal Invariants
  // =========================================================================
  describe('Scenario C2: Photo Modal Lifecycle & Dismissal Invariants', () => {

    test('T5.M3.5: Modal opens via .dish-photo-trigger, populates attributes and locks body scroll', () => {
      const doc = new MockDocument();
      const modal = doc.createElement('div');
      modal.id = 'menu-photo-modal';
      modal.className = 'menu-modal';

      const img = doc.createElement('img');
      img.className = 'menu-modal-img';
      modal.appendChild(img);

      const modalName = doc.createElement('h3');
      modalName.className = 'modal-item-name';
      modal.appendChild(modalName);

      const modalDesc = doc.createElement('p');
      modalDesc.className = 'modal-item-desc';
      modal.appendChild(modalDesc);

      const trigger = doc.createElement('button');
      trigger.className = 'dish-photo-trigger';
      trigger.setAttribute('data-img', 'https://res.cloudinary.com/dhvbqs2ba/image/upload/v1/lomo.jpg');
      trigger.setAttribute('data-name', 'Lomo Saltado');
      trigger.setAttribute('data-desc', 'Solomillo salteado al wok con cebolla y tomate');

      // Click handler as implemented in src/main.ts lines 450-474
      trigger.addEventListener('click', (e) => {
        const target = e.currentTarget;
        const imgUrl = target.getAttribute('data-img');
        const name = target.getAttribute('data-name');
        const desc = target.getAttribute('data-desc');

        const finalUrl = transformCloudinaryUrl(imgUrl);
        img.src = finalUrl;
        modalName.textContent = name || '';
        modalDesc.textContent = desc || '';
        modal.classList.add('active');
        doc.body.style.overflow = 'hidden';
      });

      trigger.click();

      assert.equal(modal.classList.contains('active'), true, 'Modal must have active class');
      assert.equal(img.src, 'https://res.cloudinary.com/dhvbqs2ba/image/upload/f_auto,q_auto,w_800,c_limit/v1/lomo.jpg');
      assert.equal(modalName.textContent, 'Lomo Saltado');
      assert.equal(modalDesc.textContent, 'Solomillo salteado al wok con cebolla y tomate');
      assert.equal(doc.body.style.overflow, 'hidden', 'Body scroll must be locked');
    });

    test('T5.M3.6: Cloudinary URL transformation matrix: handles raw, partial, and pre-normalized URLs', () => {
      // 1. Raw URL
      const raw = 'https://res.cloudinary.com/demo/image/upload/v1234/dish.jpg';
      assert.equal(transformCloudinaryUrl(raw), 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800,c_limit/v1234/dish.jpg');

      // 2. Partial transform (f_auto,q_auto without width)
      const partial = 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v1234/dish.jpg';
      assert.equal(transformCloudinaryUrl(partial), 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800,c_limit/v1234/dish.jpg');

      // 3. Fully normalized URL (must not duplicate w_ or transform segment)
      const normalized = 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800,c_limit/v1234/dish.jpg';
      assert.equal(transformCloudinaryUrl(normalized), normalized);

      // 4. Non-Cloudinary URL (preserved untouched)
      const external = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c';
      assert.equal(transformCloudinaryUrl(external), external);
    });

    test('T5.M3.7: Modal dismisses cleanly via close button and backdrop click, unlocking body scroll', () => {
      const doc = new MockDocument();
      const modal = doc.createElement('div');
      modal.id = 'menu-photo-modal';
      modal.className = 'menu-modal active';

      const img = doc.createElement('img');
      img.className = 'menu-modal-img';
      img.src = 'https://res.cloudinary.com/demo/image/upload/dish.jpg';
      modal.appendChild(img);

      const closeBtn = doc.createElement('button');
      closeBtn.className = 'close-menu-modal';
      modal.appendChild(closeBtn);

      doc.body.style.overflow = 'hidden';

      const closeFunc = () => {
        modal.classList.remove('active');
        img.src = '';
        doc.body.style.overflow = '';
      };

      closeBtn.addEventListener('click', closeFunc);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeFunc();
      });

      // 1. Close via button
      closeBtn.click();
      assert.equal(modal.classList.contains('active'), false);
      assert.equal(img.src, '');
      assert.equal(doc.body.style.overflow, '');

      // Re-open
      modal.classList.add('active');
      img.src = 'https://res.cloudinary.com/demo/image/upload/dish.jpg';
      doc.body.style.overflow = 'hidden';

      // 2. Close via backdrop click (target === modal)
      modal.dispatchEvent(new MockEvent('click'));
      assert.equal(modal.classList.contains('active'), false);
      assert.equal(img.src, '');
      assert.equal(doc.body.style.overflow, '');
    });

    test('T5.M3.8: Clicking inside modal content does NOT dismiss the modal', () => {
      const doc = new MockDocument();
      const modal = doc.createElement('div');
      modal.id = 'menu-photo-modal';
      modal.className = 'menu-modal active';

      const content = doc.createElement('div');
      content.className = 'menu-modal-content';
      modal.appendChild(content);

      let closeCalled = false;
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeCalled = true;
      });

      // Click on content container
      content.dispatchEvent(new MockEvent('click'));
      assert.equal(closeCalled, false, 'Click on modal content must not trigger backdrop close');
      assert.equal(modal.classList.contains('active'), true);
    });

    test('T5.M3.9: Accessibility Invariant: Escape key dismiss handler is present in src/main.ts', () => {
      const mainTs = fs.readFileSync(path.join(ROOT_DIR, 'src', 'main.ts'), 'utf8');

      // Check whether keydown / keyup with Escape exists
      const hasEscapeListener = (/addEventListener\s*\(\s*['"]key(down|up)['"]/i.test(mainTs) && /Escape/i.test(mainTs));

      // Empirically confirm that Escape key listener is present in production controller
      assert.equal(
        hasEscapeListener,
        true,
        'Accessibility requirement: src/main.ts must have keydown listener for Escape key dismissal'
      );
    });
  });

  // =========================================================================
  // SCENARIO C3: Edge-Case Inputs & Dirty Firestore Strings in renderMenuItemHtml
  // =========================================================================
  describe('Scenario C3: Edge-Case Inputs & Sanitization Invariants', () => {

    test('T5.M3.10: sanitizeDishName purges pictographs, flags, variation selectors while preserving Spanish accents', () => {
      const dirtyName = '🐟 Ceviche Mixto Especial de Corvina 🇵🇪 con Ají Limo 🌶️ y Maíz Chulpe 🌾\uFE0F';
      const clean = sanitizeDishName(dirtyName);

      assert.equal(clean, 'Ceviche Mixto Especial de Corvina con Ají Limo y Maíz Chulpe');
      assert.ok(!/\p{Extended_Pictographic}/u.test(clean));
      assert.ok(!/[\u{1F1E6}-\u{1F1FF}]/u.test(clean));
      assert.ok(clean.includes('Especial'));
      assert.ok(clean.includes('Ají'));
      assert.ok(clean.includes('Maíz'));
    });

    test('T5.M3.11: Pure emoji dish name is sanitized to empty string without throwing', () => {
      const pureEmoji = '🐟🥩🌶️🌾';
      const clean = sanitizeDishName(pureEmoji);
      assert.equal(clean, '');
    });

    test('T5.M3.12: Dishes with 0 tags cleanly omit the .menu-item-allergens container', () => {
      const emptyTagsItem = {
        name: 'Inca Kola',
        price: 3.5,
        tags: []
      };
      const html1 = renderMenuItemHtml(emptyTagsItem);
      assert.doesNotMatch(html1, /<div class="menu-item-allergens">/);

      const undefTagsItem = {
        name: 'Chicha Morada',
        price: 3.0
      };
      const html2 = renderMenuItemHtml(undefTagsItem);
      assert.doesNotMatch(html2, /<div class="menu-item-allergens">/);
    });

    test('T5.M3.13: Dishes with invalid tags filter them out and only emit canonical AllergenTag pills', () => {
      const dirtyTagsItem = {
        name: 'Arroz Chaufa Mixto',
        price: 22.0,
        tags: ['pollo', 'marisco', 'carne_roja', 'sin_sal', 'UNKNOWN_TAG', null, 999]
      };
      const html = renderMenuItemHtml(dirtyTagsItem);

      // Valid tags must be present
      assert.match(html, /data-allergen="pollo">POLLO<\/span>/);
      assert.match(html, /data-allergen="marisco">MARISCO<\/span>/);

      // Invalid tags must be rejected
      assert.doesNotMatch(html, /data-allergen="carne_roja"/);
      assert.doesNotMatch(html, /data-allergen="sin_sal"/);
      assert.doesNotMatch(html, /data-allergen="UNKNOWN_TAG"/);
    });

    test('T5.M3.14: Vulnerability reproduction: Non-array tags from Firestore triggers unhandled TypeError', () => {
      // In Firestore, if a document has tags: "pescado" (string) or tags: 123 instead of an array:
      // (item.tags || []).filter evaluates to "pescado".filter, which is undefined!
      const dirtyFirestoreDoc = {
        name: 'Tiradito Clásico',
        price: 20.0,
        tags: 'pescado' // String instead of Array
      };

      assert.throws(
        () => {
          // Exact expression from src/main.ts line 101:
          (dirtyFirestoreDoc.tags || []).filter(isValidAllergenTag);
        },
        {
          name: 'TypeError',
          message: /\.filter is not a function/
        },
        'Defect confirmed: (item.tags || []).filter crashes with TypeError when tags is not an Array'
      );
    });

    test('T5.M3.15: Dual pricing resilience: price <= 0 correctly uses market indicator', () => {
      const dualItem = {
        name: 'Corvina Salvaje de Lonja',
        price: 0,
        description: 'Precio según lonja diaria'
      };
      const html = renderMenuItemHtml(dualItem);

      assert.match(html, /<span class="menu-item-price dual">Precio según lonja diaria<\/span>/);
      // When dual pricing is active, descriptionBlock is empty to avoid duplicating the market text
      assert.doesNotMatch(html, /<p class="menu-item-description">/);
    });

    test('T5.M3.16: Long market price description (150+ chars) in dual pricing header layout behavior', () => {
      const longMarketDesc = 'Pieza entera de corvina salvaje pescada en el Cantábrico, desespinada y cocinada a la brasa de sarmiento con guarnición de yuca y patacones artesanos para compartir';
      const dualItem = {
        name: 'Corvina a la Brasa',
        price: 0,
        description: longMarketDesc
      };
      const html = renderMenuItemHtml(dualItem);

      // Verify that long description is housed in .menu-item-price.dual inside .menu-item-header
      assert.match(html, /<span class="menu-item-price dual">Pieza entera de corvina/);
      assert.equal(html.includes(longMarketDesc), true);
    });

    test('T5.M3.17: Attribute injection reproduction: Double quotes in description break data-desc attribute', () => {
      const itemWithQuotes = {
        name: 'Pollo Chifa',
        price: 18.0,
        description: 'Pollo salteado al estilo "Chifa" tradicional con verduras frescas',
        image_url: 'https://res.cloudinary.com/demo/image/upload/pollo.jpg'
      };
      const html = renderMenuItemHtml(itemWithQuotes);

      // In src/main.ts line 107: data-desc="${item.description || ''}"
      // Double quotes inside description break HTML attribute syntax: data-desc="... "Chifa" ..."
      assert.match(
        html,
        /data-desc="Pollo salteado al estilo "Chifa"/,
        'Attribute break confirmed: raw double quotes inside data-desc break attribute boundary'
      );

      // When parsed in DOM, the attribute is truncated at the second quote
      const doc = new MockDocument();
      const container = doc.createElement('div');
      container.innerHTML = html;
      const btn = container.querySelector('.dish-photo-trigger');
      if (btn) {
        assert.notEqual(
          btn.getAttribute('data-desc'),
          itemWithQuotes.description,
          'Defect confirmed: getAttribute("data-desc") is truncated due to unescaped double quotes'
        );
      }
    });
  });

  // =========================================================================
  // SCENARIO C4: Static Hygiene, Design Tokens & Pipeline Build SLA
  // =========================================================================
  describe('Scenario C4: Static Hygiene, Design Tokens & Pipeline SLA', () => {

    test('T5.M3.18: src/main.ts contains zero legacy emoji dictionaries (tagIcons completely eradicated)', () => {
      const mainTs = fs.readFileSync(path.join(ROOT_DIR, 'src', 'main.ts'), 'utf8');
      assert.doesNotMatch(mainTs, /const\s+tagIcons/i, 'tagIcons dictionary must not exist in main.ts');
      assert.doesNotMatch(mainTs, /'pescado':\s*'<span[^>]*>🐟<\/span>'/, 'Emoji spans for tags must be eradicated');
      assert.doesNotMatch(mainTs, /📸\s*Ver/, 'Legacy camera button must be eradicated');
    });

    test('T5.M3.19: src/style.css contains zero references to Wikimedia geoglyphs or un-cached raster assets', () => {
      const styleCss = fs.readFileSync(path.join(ROOT_DIR, 'src', 'style.css'), 'utf8');
      assert.doesNotMatch(styleCss, /upload\.wikimedia\.org/i, 'style.css must contain 0 occurrences of upload.wikimedia.org');
      assert.doesNotMatch(styleCss, /Nazca_hummingbird/i, 'Nazca hummingbird PNG must be purged');
      assert.doesNotMatch(styleCss, /Nazca_monkey/i, 'Nazca monkey PNG must be purged');
    });

    test('T5.M3.20: OFFICIAL_ALLERGEN_TAGS in src/main.ts strictly contains exactly the 16 OpenAPI enum values', () => {
      const mainTs = fs.readFileSync(path.join(ROOT_DIR, 'src', 'main.ts'), 'utf8');
      for (const tag of OFFICIAL_ALLERGEN_TAGS) {
        assert.ok(
          mainTs.includes(`'${tag}'`),
          `src/main.ts must declare canonical tag '${tag}' in OFFICIAL_ALLERGEN_TAGS`
        );
      }
    });

    test('T5.M3.21: Production CSS defines layout rules for .menu-item-footer and .allergen-pill', () => {
      const styleCss = fs.readFileSync(path.join(ROOT_DIR, 'src', 'style.css'), 'utf8');
      assert.match(styleCss, /\.menu-item-footer\s*\{/, '.menu-item-footer must be declared in style.css');
      assert.match(styleCss, /\.allergen-pill\s*\{/, '.allergen-pill must be declared in style.css');
      assert.match(styleCss, /\.dish-photo-trigger\s*\{/, '.dish-photo-trigger must be declared in style.css');
    });
  });

  // =========================================================================
  // SCENARIO C5: Milestone 3 Defect Remediation & Invariant Verification
  // =========================================================================
  describe('Scenario C5: Milestone 3 Defect Remediation Invariants', () => {

    test('T5.M3.22: Escape key listener dismisses photo modal and resets scroll lock', () => {
      const doc = new MockDocument();
      const modal = doc.createElement('div');
      modal.id = 'menu-photo-modal';
      modal.className = 'menu-modal active';

      const img = doc.createElement('img');
      img.className = 'menu-modal-img';
      img.src = 'https://res.cloudinary.com/demo/image/upload/dish.jpg';
      modal.appendChild(img);
      doc.body.style.overflow = 'hidden';

      const closePhotoModal = () => {
        modal.classList.remove('active');
        img.src = '';
        doc.body.style.overflow = '';
      };

      // Simulates document keydown listener in src/main.ts
      const keydownHandler = (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
          closePhotoModal();
        }
      };

      // Press non-Escape key (Enter) -> modal remains active
      keydownHandler({ key: 'Enter' });
      assert.equal(modal.classList.contains('active'), true);
      assert.equal(doc.body.style.overflow, 'hidden');

      // Press Escape -> modal dismisses and resets body overflow
      keydownHandler({ key: 'Escape' });
      assert.equal(modal.classList.contains('active'), false);
      assert.equal(img.src, '');
      assert.equal(doc.body.style.overflow, '');
    });

    test('T5.M3.23: Modal dismissal listeners are decoupled from loadMenu in src/main.ts', () => {
      const mainTs = fs.readFileSync(path.join(ROOT_DIR, 'src', 'main.ts'), 'utf8');

      // Verify closeModalBtn binding occurs before async function loadMenu
      const closeBtnIndex = mainTs.indexOf("closeModalBtn?.addEventListener('click', closePhotoModal)");
      const loadMenuIndex = mainTs.indexOf('async function loadMenu(');

      assert.ok(closeBtnIndex > -1, 'closeModalBtn listener must exist in src/main.ts');
      assert.ok(loadMenuIndex > -1, 'loadMenu function must exist in src/main.ts');
      assert.ok(
        closeBtnIndex < loadMenuIndex,
        'closeModalBtn listener must be initialized outside/before loadMenu to prevent listener accumulation'
      );

      // Verify Escape keydown listener also initialized outside/before loadMenu
      const escapeListenerIndex = mainTs.indexOf("e.key === 'Escape'");
      assert.ok(escapeListenerIndex > -1, 'Escape keydown listener must exist');
      assert.ok(
        escapeListenerIndex < loadMenuIndex,
        'Escape keydown listener must be initialized outside/before loadMenu'
      );
    });

    test('T5.M3.24: Defensive Array.isArray guard protects renderMenuItemHtml from non-array tags crash', () => {
      const mainTs = fs.readFileSync(path.join(ROOT_DIR, 'src', 'main.ts'), 'utf8');

      // Verify defensive guard Array.isArray is used in main.ts
      assert.match(
        mainTs,
        /Array\.isArray\(item\.tags\)\s*\?\s*item\.tags\s*:\s*\[\]/,
        'renderMenuItemHtml must guard item.tags with Array.isArray'
      );
      assert.match(
        mainTs,
        /Array\.isArray\(d\.tags\)\s*\?\s*d\.tags\s*:\s*\[\]/,
        'loadMenu tag filter must guard d.tags with Array.isArray'
      );
    });

    test('T5.M3.25: HTML attribute double quotes are properly escaped to &quot; in data-desc and data-name', () => {
      const mainTs = fs.readFileSync(path.join(ROOT_DIR, 'src', 'main.ts'), 'utf8');

      assert.match(
        mainTs,
        /cleanName\.replace\(\/\"\/g,\s*'&quot;'\)/,
        'data-name must escape double quotes to &quot;'
      );
      assert.match(
        mainTs,
        /\.replace\(\/\"\/g,\s*'&quot;'\)/,
        'data-desc must escape double quotes to &quot;'
      );
    });

    test('T5.M3.26: Production CSS enforces flex-wrap: wrap on .menu-item-header for mobile viewports', () => {
      const styleCss = fs.readFileSync(path.join(ROOT_DIR, 'src', 'style.css'), 'utf8');

      assert.match(
        styleCss,
        /\.menu-item-header\s*\{[^}]*flex-wrap:\s*wrap;/s,
        '.menu-item-header must declare flex-wrap: wrap in style.css'
      );
    });
  });
});
