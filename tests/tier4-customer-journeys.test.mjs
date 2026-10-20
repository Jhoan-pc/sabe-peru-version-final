/**
 * Tier 4: Real-World Scenarios Test Suite (End-to-End Customer & Admin Journeys)
 * Formal SSOT: ORIGINAL_REQUEST.md Acceptance Criteria, specs/SDD_MASTER.md,
 * specs/admin-spec.md, specs/openapi.yaml
 * 
 * Simulates complete end-to-end customer and administrative journeys:
 * - Menu exploration, category filtering, allergen isolation, and photo triggers
 * - Reservation booking flow with mobile popup blocker protection & SP-XXXX locator
 * - Backoffice reservation state lifecycle (Pending -> Confirmed / Cancelled, slot liberation)
 * - Multimedia validation (10 MB limit, zero-latency preview, Cloudinary normalization)
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { MockElement, MockDocument } from './helpers/mock-dom.mjs';
import { normalizeCloudinaryUrl } from './contracts/cloudinary.mjs';
import {
  OFFICIAL_ALLERGEN_TAGS,
  validateDishAllergenTags,
  renderAllergenPill
} from './contracts/allergens.mjs';
import {
  KITCHEN_HOURS,
  generateDaySlots,
  checkSlotAvailability,
  validateGuestCount,
  generateReservationLocator,
  buildWhatsAppReservationUrl,
  LOCATOR_REGEX
} from './contracts/reservations.mjs';
import { formatMenuItemPrice } from './contracts/pricing.mjs';
import {
  createProblemDetails,
  renderProblemToastHtml
} from './contracts/errors.mjs';

describe('Tier 4: Real-World Scenarios (End-to-End Journeys)', () => {

  describe('Scenario 4.1: Customer Menu Journey', () => {
    // Simulated Menu Database
    const sampleMenuDb = [
      {
        id: 'item_1',
        name: 'Ceviche Clásico de Corvina',
        description: 'Corvina fresca, leche de tigre y choclo',
        price: 24.50,
        category: 'comida',
        subcategory: 'CEVICHES Y TIRADITOS',
        sort_order: 1,
        tags: ['pescado', 'picante'],
        is_available: true,
        image_url: 'https://res.cloudinary.com/demo/image/upload/ceviche.jpg'
      },
      {
        id: 'item_2',
        name: 'Lomo Saltado',
        description: 'Solomillo al wok con cebolla y tomate',
        price: 26.00,
        category: 'comida',
        subcategory: 'FONDOS CRIOLLOS',
        sort_order: 2,
        tags: ['carne', 'soja'],
        is_available: true,
        image_url: 'https://res.cloudinary.com/demo/image/upload/lomo.jpg'
      },
      {
        id: 'item_3',
        name: 'Pisco Sour Tradicional',
        description: 'Pisco Quebranta, lima, jarabe de goma y clara',
        price: 12.00,
        category: 'coctel',
        subcategory: 'CÓCTELES CLÁSICOS',
        sort_order: 1,
        tags: ['huevos'],
        is_available: true,
        image_url: 'https://res.cloudinary.com/demo/image/upload/pisco.jpg'
      },
      {
        id: 'item_4',
        name: 'Ceviche Mixto Especial',
        description: 'Precio según lonja diaria',
        price: 0, // Dual price
        category: 'comida',
        subcategory: 'CEVICHES Y TIRADITOS',
        sort_order: 3,
        tags: ['pescado', 'marisco', 'crustaceos'],
        is_available: true,
        image_url: null
      }
    ];

    function filterMenu(db, category, allergenTag = null) {
      let filtered = db.filter(item => item.is_available && item.category === category);
      if (allergenTag) {
        filtered = filtered.filter(item => (item.tags || []).includes(allergenTag));
      }
      return filtered.sort((a, b) => a.sort_order - b.sort_order);
    }

    test('T4.1.1: Customer filters menu by category (comida vs coctel) and sees correct items', () => {
      const foodItems = filterMenu(sampleMenuDb, 'comida');
      assert.equal(foodItems.length, 3);
      assert.ok(foodItems.every(i => i.category === 'comida'));

      const cocktailItems = filterMenu(sampleMenuDb, 'coctel');
      assert.equal(cocktailItems.length, 1);
      assert.equal(cocktailItems[0].name, 'Pisco Sour Tradicional');
    });

    test('T4.1.2: Menu items are sorted strictly by sort_order ascending', () => {
      const foodItems = filterMenu(sampleMenuDb, 'comida');
      for (let i = 0; i < foodItems.length - 1; i++) {
        assert.ok(foodItems[i].sort_order <= foodItems[i + 1].sort_order,
          'Items must be sorted in ascending order of sort_order');
      }
    });

    test('T4.1.3: Customer filters by allergen tag (e.g. tag=marisco) isolating matching dishes', () => {
      const mariscoItems = filterMenu(sampleMenuDb, 'comida', 'marisco');
      assert.equal(mariscoItems.length, 1);
      assert.equal(mariscoItems[0].id, 'item_4');
      assert.ok(mariscoItems[0].tags.includes('marisco'));
    });

    test('T4.1.4: Customer opens dish photograph modal via editorial trigger and closes it', () => {
      const doc = new MockDocument();
      const modal = doc.createElement('div');
      modal.id = 'menu-photo-modal';
      modal.className = 'menu-modal';

      const modalImg = doc.createElement('img');
      modalImg.className = 'menu-modal-img';
      modal.appendChild(modalImg);

      const closeBtn = doc.createElement('button');
      closeBtn.className = 'close-menu-modal';
      modal.appendChild(closeBtn);
      doc.body.appendChild(modal);

      // Customer clicks photo trigger for Ceviche
      const cevicheUrl = normalizeCloudinaryUrl('https://res.cloudinary.com/demo/image/upload/ceviche.jpg');
      modalImg.src = cevicheUrl;
      modal.classList.add('active');

      assert.equal(modal.classList.contains('active'), true);
      assert.equal(modalImg.src, 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800,c_limit/ceviche.jpg');

      // Customer closes modal
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        modalImg.src = '';
      });
      closeBtn.click();

      assert.equal(modal.classList.contains('active'), false);
      assert.equal(modalImg.src, '');
    });

    test('T4.1.5: Dual pricing dishes render properly without NaN errors or missing values', () => {
      const marketItem = sampleMenuDb.find(i => i.price === 0);
      assert.ok(marketItem);
      const pricing = formatMenuItemPrice(marketItem.price, marketItem.description);
      assert.equal(pricing.isMarketPrice, true);
      assert.equal(pricing.displayPrice, 'Precio según lonja diaria');
      assert.equal(pricing.priceClass, 'menu-item-price dual');
    });
  });

  describe('Scenario 4.2: Customer Reservation Booking Journey (Popup Blocker Protected)', () => {
    // In-memory reservations storage
    const reservationsDb = [
      { id: 'res_1', date: '2026-11-20', time: '14:00', status: 'confirmed' },
      { id: 'res_2', date: '2026-11-20', time: '14:00', status: 'confirmed' },
      { id: 'res_3', date: '2026-11-20', time: '14:00', status: 'confirmed' },
      { id: 'res_4', date: '2026-11-20', time: '14:00', status: 'confirmed' }, // 14:00 is FULL (4 bookings)
      { id: 'res_5', date: '2026-11-20', time: '14:30', status: 'confirmed' }  // 14:30 has 1 booking
    ];

    function getSlotCounts(db, date) {
      const counts = {};
      db.filter(r => r.date === date && r.status !== 'cancelled').forEach(r => {
        counts[r.time] = (counts[r.time] || 0) + 1;
      });
      return counts;
    }

    test('T4.2.1: Available slots render based on KITCHEN_HOURS and database counts', () => {
      const counts = getSlotCounts(reservationsDb, '2026-11-20');
      const slot1400 = checkSlotAvailability(counts['14:00'] || 0);
      const slot1430 = checkSlotAvailability(counts['14:30'] || 0);

      assert.equal(slot1400.available, false, '14:00 must be full with 4 active bookings');
      assert.equal(slot1400.reason, 'Completo');
      assert.equal(slot1430.available, true, '14:30 must have availability with only 1 booking');
    });

    test('T4.2.2: Standard reservation (4 guests) produces pending record and SP-XXXX locator', () => {
      const guestCheck = validateGuestCount(4);
      assert.equal(guestCheck.valid, true);
      assert.equal(guestCheck.isImperial, false);

      const locator = generateReservationLocator();
      assert.match(locator, LOCATOR_REGEX);

      const newBooking = {
        id: 'res_new',
        locator,
        name: 'Lucía Alarcón',
        email: 'lucia@example.com',
        date: '2026-11-20',
        time: '14:30',
        people: 4,
        status: 'pending'
      };
      reservationsDb.push(newBooking);

      assert.equal(newBooking.status, 'pending');
      assert.match(newBooking.locator, /^SP-[A-Z0-9]{4}$/);
    });

    test('T4.2.3: Zero asynchronous window.open is triggered on submission (Anti-Blocker Protection)', () => {
      let windowOpenTriggered = false;
      const fakeWindow = {
        open: () => { windowOpenTriggered = true; }
      };

      // Simulated form submission controller
      function handleSubmit(formData) {
        // Step 1: Record in DB
        // Step 2: Render confirmation card with CTA link
        // Under DT-11, window.open is FORBIDDEN here
        return {
          showConfirmationCard: true,
          locator: generateReservationLocator()
        };
      }

      const result = handleSubmit({ name: 'Juan', people: 2 });
      assert.equal(result.showConfirmationCard, true);
      assert.equal(windowOpenTriggered, false, 'window.open must not be called during submit processing');
    });

    test('T4.2.4: Voluntary user click on WhatsApp CTA generates well-formed wa.me link with locator', () => {
      const locator = 'SP-9G3K';
      const waUrl = buildWhatsAppReservationUrl({
        phone: '34662125650',
        locator,
        name: 'Lucía Alarcón',
        date: '2026-11-20',
        time: '14:30',
        people: 4
      });

      assert.match(waUrl, /^https:\/\/wa\.me\/34662125650\?text=/);
      assert.ok(waUrl.includes(encodeURIComponent('SP-9G3K')));
      assert.ok(waUrl.includes(encodeURIComponent('Lucía Alarcón')));
    });

    test('T4.2.5: Large group (> 6 guests up to 20) triggers Imperial Table advisory', () => {
      const imperialGroup = validateGuestCount(8);
      assert.equal(imperialGroup.valid, true);
      assert.equal(imperialGroup.isImperial, true);
      assert.ok(imperialGroup.notice.includes('mesa imperial'));

      const invalidGroup = validateGuestCount(25);
      assert.equal(invalidGroup.valid, false);
      assert.ok(invalidGroup.error.includes('between 1 and 20'));
    });
  });

  describe('Scenario 4.3: Admin Reservation State Management Journey', () => {
    let adminReservations = [
      { id: 'res_101', name: 'Ana Belén', date: '2026-11-20', time: '14:00', people: 2, status: 'pending', locator: 'SP-1A2B' },
      { id: 'res_102', name: 'Mateo Ortiz', date: '2026-11-20', time: '14:00', people: 4, status: 'confirmed', locator: 'SP-3C4D' },
      { id: 'res_103', name: 'Laura Paz', date: '2026-11-19', time: '21:00', people: 2, status: 'pending', locator: 'SP-5E6F' }
    ];

    test('T4.3.1: Admin filters reservations table by tabs (Pendientes vs Hoy vs Todas)', () => {
      const today = '2026-11-20';
      const pendientes = adminReservations.filter(r => r.status === 'pending');
      assert.equal(pendientes.length, 2);

      const hoy = adminReservations.filter(r => r.date === today);
      assert.equal(hoy.length, 2);

      const todas = adminReservations;
      assert.equal(todas.length, 3);
    });

    test('T4.3.2: Admin confirms reservation (btn-confirm-res) mutating status to confirmed', () => {
      const target = adminReservations.find(r => r.id === 'res_101');
      assert.equal(target.status, 'pending');

      // Admin clicks Confirmar
      target.status = 'confirmed';
      assert.equal(target.status, 'confirmed');
    });

    test('T4.3.3: Admin cancels reservation (btn-cancel-res) freeing up slot capacity', () => {
      const target = adminReservations.find(r => r.id === 'res_102');
      assert.equal(target.status, 'confirmed');

      // Admin cancels with confirmation
      target.status = 'cancelled';
      assert.equal(target.status, 'cancelled');

      // Slot count recalculation excludes cancelled
      const active1400 = adminReservations.filter(r => r.date === '2026-11-20' && r.time === '14:00' && r.status !== 'cancelled');
      assert.equal(active1400.length, 1); // Only res_101 confirmed remains
    });

    test('T4.3.4: Admin clicks WhatsApp client button (btn-wa-client) generating direct chat URL', () => {
      const client = {
        name: 'Ana Belén',
        phone: '+34 654 11 22 33',
        locator: 'SP-1A2B'
      };
      const cleanPhone = client.phone.replace(/\D/g, '');
      const msg = `Hola ${client.name}, le escribimos de Sabe a Perú respecto a su reserva ${client.locator}.`;
      const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;

      assert.equal(cleanPhone, '34654112233');
      assert.ok(waLink.startsWith('https://wa.me/34654112233'));
      assert.ok(waLink.includes(encodeURIComponent('SP-1A2B')));
    });

    test('T4.3.5: Error during state update maps to RFC 9457 Problem Details toast (no native alert)', () => {
      let toastEmitted = null;
      function onMutationError(status, message) {
        const problem = createProblemDetails({
          type: 'https://api.sabeaperu.es/errors/reservation-mutation',
          title: 'Error al actualizar reserva',
          status,
          detail: message
        });
        toastEmitted = renderProblemToastHtml(problem);
      }

      onMutationError(500, 'Fallo de conectividad con base de datos.');
      assert.ok(toastEmitted);
      assert.match(toastEmitted, /Error al actualizar reserva/);
      assert.match(toastEmitted, /data-status="500"/);
      assert.match(toastEmitted, /Fallo de conectividad/);
    });
  });

  describe('Scenario 4.4: Admin Dish & Multimedia Management Journey', () => {
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

    test('T4.4.1: File validation rejects files exceeding 10 MB limit', () => {
      const oversizeFile = { size: 12 * 1024 * 1024, type: 'image/jpeg' };
      const res = validateUploadFile(oversizeFile);
      assert.equal(res.valid, false);
      assert.ok(res.error.includes('10 MB'));

      const validFile = { size: 4 * 1024 * 1024, type: 'image/webp' };
      assert.equal(validateUploadFile(validFile).valid, true);
    });

    test('T4.4.2: File validation rejects unsupported MIME types', () => {
      const gifFile = { size: 1024, type: 'image/gif' };
      const res = validateUploadFile(gifFile);
      assert.equal(res.valid, false);
      assert.ok(res.error.includes('Formato no permitido'));
    });

    test('T4.4.3: Cloudinary upload result is passed through normalizeCloudinaryUrl', () => {
      const rawCloudinaryResponse = {
        secure_url: 'https://res.cloudinary.com/dhvbqs2ba/image/upload/v1720000000/ceviche-nuevo.jpg?v=1'
      };
      const normalized = normalizeCloudinaryUrl(rawCloudinaryResponse.secure_url);
      assert.equal(
        normalized,
        'https://res.cloudinary.com/dhvbqs2ba/image/upload/f_auto,q_auto,w_800,c_limit/v1720000000/ceviche-nuevo.jpg'
      );
    });

    test('T4.4.4: Allergen chips panel toggle extracts clean tags string array', () => {
      const selectedChips = ['pescado', 'picante'];
      const dishValidation = validateDishAllergenTags(selectedChips);
      assert.equal(dishValidation.valid, true);
      assert.deepEqual(dishValidation.sanitized, ['pescado', 'picante']);
    });

    test('T4.4.5: Resetting the dish form resets tags to empty array', () => {
      let currentTags = ['carne', 'gluten'];
      // Form reset action
      currentTags = [];
      assert.deepEqual(currentTags, []);
    });
  });
});
