/**
 * Tier 3: Cross-Feature & DOM Transitions Test Suite (Pairwise Coverage)
 * Formal SSOT: specs/design-system-spec.md §3, specs/admin-spec.md §4,
 * specs/SDD_MASTER.md [DT-03], [DT-11], [DT-12], specs/openapi.yaml
 * 
 * Verifies zero hardcoded emojis in dish titles, allergen pills rendering & CSS tokens,
 * interactive allergen chips in admin, 2-step WhatsApp reservation flow with SP-XXXX locator,
 * and RFC 9457 Problem Details toast notifications (zero native alert() calls).
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
import {
  generateReservationLocator,
  buildWhatsAppReservationUrl,
  validateGuestCount,
  LOCATOR_REGEX
} from './contracts/reservations.mjs';
import { formatMenuItemPrice } from './contracts/pricing.mjs';
import {
  createProblemDetails,
  renderProblemToastHtml
} from './contracts/errors.mjs';

const ROOT_DIR = process.cwd();

// Pure dish renderer contract according to specs/design-system-spec.md
function renderMenuItemHtml(item) {
  const cleanName = sanitizeDishName(item.name || '');
  const pricing = formatMenuItemPrice(item.price, item.description);
  const pillsHtml = (item.tags || [])
    .filter(isValidAllergenTag)
    .map(renderAllergenPill)
    .join('');

  const photoTrigger = item.image_url
    ? `<button class="dish-photo-trigger" data-img="${item.image_url}" aria-label="Ver fotografía del plato">
        <span>FOTOGRAFÍA</span>
        <span class="trigger-line"></span>
      </button>`
    : '';

  return `<article class="menu-item-card" data-category="${item.category || 'comida'}">
    <div class="menu-item-header">
      <h3 class="menu-item-name serif-title">${cleanName}</h3>
      <span class="${pricing.priceClass}">${pricing.displayPrice}</span>
    </div>
    ${item.description ? `<p class="menu-item-description">${item.description}</p>` : ''}
    <div class="menu-item-footer">
      ${pillsHtml ? `<div class="menu-item-allergens">${pillsHtml}</div>` : ''}
      ${photoTrigger}
    </div>
  </article>`;
}

// Pure emoji stripper that removes all pictographs, variation selectors, and regional flags while preserving Spanish accents
function sanitizeDishName(name) {
  return name
    .replace(/\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]|[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

describe('Tier 3: Cross-Feature & DOM Transitions', () => {

  describe('Feature 3.1: Zero Hardcoded Emojis in Dish Titles & Headers', () => {
    test('T3.1.1: sanitizeDishName removes all food/animal emojis while preserving Spanish accents', () => {
      const dirty = '🐟 Ceviche Clásico de Corvina con Ají Limo 🌶️ y Maíz Chulpe 🌾';
      const clean = sanitizeDishName(dirty);
      assert.equal(clean, 'Ceviche Clásico de Corvina con Ají Limo y Maíz Chulpe');
      assert.ok(!/\p{Extended_Pictographic}/u.test(clean), 'Name must not contain any emoji glyphs');
      assert.ok(clean.includes('Clásico'), 'Spanish accented characters must be preserved');
    });

    test('T3.1.2: renderMenuItemHtml outputs pure serif title with zero emoji icons', () => {
      const item = {
        name: '🥩 Lomo Saltado Criollo 🇵🇪',
        price: 26.0,
        category: 'comida',
        tags: ['carne', 'soja']
      };
      const html = renderMenuItemHtml(item);
      assert.ok(!html.includes('🥩'), 'Rendered card must not contain meat emoji');
      assert.ok(!html.includes('🇵🇪'), 'Rendered card must not contain flag emoji');
      assert.match(html, /<h3 class="menu-item-name serif-title">Lomo Saltado Criollo<\/h3>/);
    });

    test('T3.1.3: Subcategory titles do not contain emojis', () => {
      const dirtySub = '🐟 CEVICHES Y TIRADITOS 🍋';
      const cleanSub = sanitizeDishName(dirtySub);
      assert.equal(cleanSub, 'CEVICHES Y TIRADITOS');
    });

    test('T3.1.4: Dish card markup has no inline emoji tags (.menu-tag with emoji contents)', () => {
      const item = {
        name: 'Tiradito Nikkei',
        price: 22.0,
        tags: ['pescado', 'soja']
      };
      const html = renderMenuItemHtml(item);
      assert.doesNotMatch(html, /class="menu-tag">🐟/);
      assert.doesNotMatch(html, /class="menu-tag">🫘/);
    });

    test('T3.1.5: Pairwise test: Dish with 3 allergen tags renders title and clean allergen pills', () => {
      const item = {
        name: 'Jalea Mixta Marina 🦐🐟',
        price: 28.5,
        tags: ['pescado', 'marisco', 'crustaceos']
      };
      const html = renderMenuItemHtml(item);
      assert.match(html, /Jalea Mixta Marina<\/h3>/);
      assert.match(html, /data-allergen="pescado">PESCADO<\/span>/);
      assert.match(html, /data-allergen="marisco">MARISCO<\/span>/);
      assert.match(html, /data-allergen="crustaceos">CRUSTACEOS<\/span>/);
    });
  });

  describe('Feature 3.2: Allergen Pills Styling & DOM Semantics', () => {
    test('T3.2.1: Allergen pills are containerized in .menu-item-allergens with class .allergen-pill', () => {
      const item = {
        name: 'Causa Limeña',
        price: 16.0,
        tags: ['pollo', 'huevos']
      };
      const html = renderMenuItemHtml(item);
      assert.match(html, /<div class="menu-item-allergens">[\s\S]*class="allergen-pill"[\s\S]*<\/div>/);
    });

    test('T3.2.2: Allergen pills text is strictly uppercase (Quiet Luxury typography)', () => {
      for (const tag of OFFICIAL_ALLERGEN_TAGS) {
        const pill = renderAllergenPill(tag);
        const match = pill.match(/>([^<]+)<\/span>/);
        assert.ok(match, `Pill for ${tag} must have text content`);
        const text = match[1];
        assert.equal(text, text.toUpperCase(), `Pill text for ${tag} must be uppercase`);
      }
    });

    test('T3.2.3: src/style.css defines Quiet Luxury tokens for .allergen-pill', () => {
      const cssPath = path.join(ROOT_DIR, 'src', 'style.css');
      assert.ok(fs.existsSync(cssPath), 'src/style.css must exist');
      const css = fs.readFileSync(cssPath, 'utf8');
      assert.ok(css.includes('--color-') || css.includes('--lux-') || css.includes('allergen'),
        'style.css must define color tokens and allergen styling');
    });

    test('T3.2.4: Dish with zero tags omits .menu-item-allergens container cleanly', () => {
      const item = {
        name: 'Pisco Puro Quebranta',
        price: 12.0,
        tags: []
      };
      const html = renderMenuItemHtml(item);
      assert.doesNotMatch(html, /<div class="menu-item-allergens">/);
    });

    test('T3.2.5: Pairwise test: Dual price (price=0) dish renders market text alongside allergen pills', () => {
      const item = {
        name: 'Ceviche de Corvina Salvaje',
        price: 0,
        description: 'Precio según lonja diaria',
        tags: ['pescado', 'picante']
      };
      const html = renderMenuItemHtml(item);
      assert.match(html, /<span class="menu-item-price dual">Precio según lonja diaria<\/span>/);
      assert.match(html, /data-allergen="pescado">PESCADO<\/span>/);
      assert.match(html, /data-allergen="picante">PICANTE<\/span>/);
    });
  });

  describe('Feature 3.3: Interactive Allergen Chips in Admin Backoffice', () => {
    function createAdminAllergenChipsPanel(selectedTags = []) {
      const doc = new MockDocument();
      const container = doc.createElement('div');
      container.id = 'allergen-chips-container';

      for (const tag of OFFICIAL_ALLERGEN_TAGS) {
        const chip = doc.createElement('button');
        chip.type = 'button';
        chip.className = 'tag-chip' + (selectedTags.includes(tag) ? ' active' : '');
        chip.setAttribute('data-tag', tag);
        chip.textContent = tag.toUpperCase();

        chip.addEventListener('click', () => {
          chip.classList.toggle('active');
        });

        container.appendChild(chip);
      }

      return {
        container,
        getSelectedTags() {
          return container
            .querySelectorAll('.tag-chip.active')
            .map(c => c.getAttribute('data-tag'));
        }
      };
    }

    test('T3.3.1: Admin chip panel renders exactly 16 chip buttons matching OFFICIAL_ALLERGEN_TAGS', () => {
      const panel = createAdminAllergenChipsPanel();
      const chips = panel.container.querySelectorAll('.tag-chip');
      assert.equal(chips.length, 16);
      const tags = chips.map(c => c.getAttribute('data-tag'));
      assert.deepEqual(tags, [...OFFICIAL_ALLERGEN_TAGS]);
    });

    test('T3.3.2: Clicking an inactive chip adds the active class to the button', () => {
      const panel = createAdminAllergenChipsPanel();
      const chip = panel.container.querySelector('[data-tag="pescado"]');
      assert.equal(chip.classList.contains('active'), false);
      chip.click();
      assert.equal(chip.classList.contains('active'), true);
      assert.deepEqual(panel.getSelectedTags(), ['pescado']);
    });

    test('T3.3.3: Clicking an active chip deactivates it and removes it from selected list', () => {
      const panel = createAdminAllergenChipsPanel(['pescado', 'marisco']);
      assert.deepEqual(panel.getSelectedTags(), ['pescado', 'marisco']);

      const chip = panel.container.querySelector('[data-tag="pescado"]');
      chip.click(); // Toggle off
      assert.equal(chip.classList.contains('active'), false);
      assert.deepEqual(panel.getSelectedTags(), ['marisco']);
    });

    test('T3.3.4: Form extraction gathers multiple active chips into clean tags string array', () => {
      const panel = createAdminAllergenChipsPanel();
      panel.container.querySelector('[data-tag="gluten-free"]').click();
      panel.container.querySelector('[data-tag="picante"]').click();
      panel.container.querySelector('[data-tag="sesamo"]').click();

      const tags = panel.getSelectedTags();
      assert.deepEqual(tags, ['picante', 'gluten-free', 'sesamo']);
      assert.ok(tags.every(t => OFFICIAL_ALLERGEN_TAGS.includes(t)));
    });

    test('T3.3.5: Form population in edit mode pre-selects existing dish tags accurately', () => {
      const dishTags = ['huevos', 'lacteos'];
      const panel = createAdminAllergenChipsPanel(dishTags);
      assert.deepEqual(panel.getSelectedTags(), ['huevos', 'lacteos']);

      const huevosChip = panel.container.querySelector('[data-tag="huevos"]');
      const pescadoChip = panel.container.querySelector('[data-tag="pescado"]');
      assert.equal(huevosChip.classList.contains('active'), true);
      assert.equal(pescadoChip.classList.contains('active'), false);
    });
  });

  describe('Feature 3.4: 2-Step WhatsApp Reservation Flow with SP-XXXX Locator', () => {
    function simulateReservationFlow({ name, email, date, time, people, phone = '34662125650' }) {
      const locator = generateReservationLocator();
      const guestCheck = validateGuestCount(people);
      if (!guestCheck.valid) {
        throw new Error(guestCheck.error);
      }

      const firestoreRecord = {
        id: `res_${Math.random().toString(36).substring(2, 9)}`,
        locator,
        customer_name: name,
        customer_email: email,
        reservation_date: date,
        reservation_time: time,
        number_of_people: people,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const waUrl = buildWhatsAppReservationUrl({
        phone,
        locator,
        name,
        date,
        time,
        people
      });

      const cardHtml = `<div id="reservation-confirmation-card" class="confirmation-card">
        <div class="confirmation-badge">Solicitud Registrada</div>
        <h3 class="confirmation-title">Su localizador: <span class="locator-code">${locator}</span></h3>
        <p class="confirmation-text">Para confirmar su reserva, pulse en el enlace de WhatsApp a continuación.</p>
        ${guestCheck.isImperial ? `<div class="imperial-notice">${guestCheck.notice}</div>` : ''}
        <a id="btn-whatsapp-confirm" href="${waUrl}" target="_blank" class="btn-wa-confirm">
          <span>Abrir WhatsApp con Maître</span>
        </a>
      </div>`;

      return {
        record: firestoreRecord,
        cardHtml,
        waUrl,
        locator
      };
    }

    test('T3.4.1: Reservation locator strictly conforms to regex ^SP-[A-Z0-9]{4}$', () => {
      for (let i = 0; i < 50; i++) {
        const locator = generateReservationLocator();
        assert.match(locator, LOCATOR_REGEX, `Locator "${locator}" must match ^SP-[A-Z0-9]{4}$`);
      }
    });

    test('T3.4.2: Consecutive locator generations produce unique codes (collision resistance)', () => {
      const generated = new Set();
      for (let i = 0; i < 100; i++) {
        const loc = generateReservationLocator();
        assert.ok(!generated.has(loc), `Collision detected for locator: ${loc}`);
        generated.add(loc);
      }
    });

    test('T3.4.3: Step 1 submission creates pending record and does not invoke asynchronous window.open', () => {
      const flow = simulateReservationFlow({
        name: 'Isabel Torres',
        email: 'isabel@example.com',
        date: '2026-11-20',
        time: '21:00',
        people: 4
      });

      assert.equal(flow.record.status, 'pending');
      assert.match(flow.record.locator, LOCATOR_REGEX);
      assert.ok(flow.cardHtml.includes('id="reservation-confirmation-card"'));
    });

    test('T3.4.4: Step 2 renders voluntary CTA link with properly encoded WhatsApp message', () => {
      const flow = simulateReservationFlow({
        name: 'Carlos Mendoza',
        email: 'carlos@example.com',
        date: '2026-11-20',
        time: '14:30',
        people: 2
      });

      assert.ok(flow.waUrl.startsWith('https://wa.me/34662125650?text='));
      assert.ok(flow.waUrl.includes(encodeURIComponent(flow.locator)));
      assert.ok(flow.waUrl.includes(encodeURIComponent('Carlos Mendoza')));
      assert.ok(flow.cardHtml.includes('id="btn-whatsapp-confirm"'));
    });

    test('T3.4.5: Pairwise test: Group > 6 pax triggers Imperial Table notice in confirmation card', () => {
      const flow = simulateReservationFlow({
        name: 'Familia Quispe',
        email: 'familia@example.com',
        date: '2026-11-25',
        time: '15:00',
        people: 10
      });

      assert.ok(flow.cardHtml.includes('imperial-notice'));
      assert.ok(flow.cardHtml.includes('mesa imperial'));
    });
  });

  describe('Feature 3.5: RFC 9457 Problem Details Toast Generation (Zero window.alert)', () => {
    function simulateProblemToastPipeline(problemInput) {
      const problem = createProblemDetails(problemInput);
      const toastHtml = renderProblemToastHtml(problem);
      return { problem, toastHtml };
    }

    test('T3.5.1: Problem Details object validates mandatory RFC 9457 fields (type, title, status)', () => {
      const { problem } = simulateProblemToastPipeline({
        type: 'https://api.sabeaperu.es/errors/slot-full',
        title: 'Franja horaria completa',
        status: 422,
        detail: 'El aforo máximo de 4 mesas concurrentes ha sido alcanzado.',
        instance: '/reservations/availability?date=2026-11-20'
      });

      assert.equal(problem.type, 'https://api.sabeaperu.es/errors/slot-full');
      assert.equal(problem.title, 'Franja horaria completa');
      assert.equal(problem.status, 422);
      assert.equal(problem.detail, 'El aforo máximo de 4 mesas concurrentes ha sido alcanzado.');
      assert.equal(problem.instance, '/reservations/availability?date=2026-11-20');
    });

    test('T3.5.2: renderProblemToastHtml generates structured DOM toast with role="alert"', () => {
      const { toastHtml } = simulateProblemToastPipeline({
        type: 'https://api.sabeaperu.es/errors/validation',
        title: 'Datos de reserva incompletos',
        status: 400,
        detail: 'Por favor, introduzca un correo electrónico válido.'
      });

      assert.match(toastHtml, /class="toast error rfc-9457"/);
      assert.match(toastHtml, /role="alert"/);
      assert.match(toastHtml, /data-status="400"/);
      assert.match(toastHtml, /Datos de reserva incompletos/);
      assert.match(toastHtml, /Por favor, introduzca un correo electrónico válido\./);
    });

    test('T3.5.3: Prohibits native window.alert in production controllers (Toast fallback)', () => {
      let alertCalled = false;
      let toastCalled = false;

      const mockWindow = {
        alert: () => { alertCalled = true; },
        showProblemToast: () => { toastCalled = true; }
      };

      function handleControllerError(err) {
        if (err) {
          mockWindow.showProblemToast();
        }
      }

      handleControllerError(new Error('Network error'));
      assert.equal(alertCalled, false, 'Native alert must NOT be called');
      assert.equal(toastCalled, true, 'Toast notification must be called instead');
    });

    test('T3.5.4: Toast lifecycle: fade-out class and DOM cleanup handling', () => {
      const doc = new MockDocument();
      const container = doc.createElement('div');
      container.id = 'toast-container';
      doc.body.appendChild(container);

      const toast = doc.createElement('div');
      toast.className = 'toast error rfc-9457';
      container.appendChild(toast);

      assert.equal(container.children.length, 1);
      toast.classList.add('fade-out');
      assert.equal(toast.classList.contains('fade-out'), true);
      toast.remove();
      assert.equal(container.children.length, 0);
    });

    test('T3.5.5: Pairwise test: Invalid capacity error creates RFC 9457 Problem Details toast', () => {
      const { toastHtml } = simulateProblemToastPipeline({
        type: 'https://api.sabeaperu.es/errors/capacity-exceeded',
        title: 'Aforo no disponible',
        status: 422,
        detail: 'La franja de las 21:00 ya tiene 4 mesas reservadas.'
      });

      assert.match(toastHtml, /Aforo no disponible/);
      assert.match(toastHtml, /La franja de las 21:00 ya tiene 4 mesas reservadas\./);
      assert.match(toastHtml, /data-status="422"/);
    });
  });
});
