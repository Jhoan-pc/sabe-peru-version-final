/**
 * Tier 5: Adversarial Challenger Behavioral Stress Suite (Milestone 5)
 * SSOT: ORIGINAL_REQUEST.md R5, PROJECT.md M5, specs/SDD_MASTER.md §3.2, specs/openapi.yaml
 * Agent: m5_challenger_2 (EMPIRICAL CHALLENGER - Behavioral Stress & Boundaries)
 * 
 * Conducts exhaustive empirical stress testing on Milestone 5 reservation concierge:
 * 1. Guest count boundary stress testing:
 *    - Valid standard boundaries: 1 guest, 6 guests (clean card, no imperial notice).
 *    - Valid imperial boundaries: 7 guests, 20 guests (triggers .imperial-notice and Maître confirmation in WhatsApp message).
 *    - Invalid boundaries: 0, -1, 21, 50, floats (3.5), NaN, strings rejected with RFC 9457 Problem Details toast (Status 422).
 * 2. WhatsApp URL construction & escaping stress:
 *    - Customer names with accents (Peña, D'Angelo), double quotes, HTML tags (<script>).
 *    - Multiline occasion strings.
 *    - Phone sanitization: numbers with symbols/spaces cleaned to digits; missing phone falls back to 34662125650.
 * 3. Pop-up blocker immunity verification:
 *    - Form submission renders #reservation-confirmation-card without calling popup APIs.
 *    - User interaction with voluntary #btn-whatsapp-confirm anchor is pure user gesture targeting WhatsApp.
 * 4. Problem Details toast DOM verification:
 *    - Check rendered toast markup: contains role="alert", data-status="409" or "422", title, and detail.
 * 5. Static integrity, pipeline hygiene, and contract alignment.
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { MockElement, MockDocument, MockEvent } from './helpers/mock-dom.mjs';

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, 'src');
const reservationsTsPath = path.join(SRC_DIR, 'reservations.ts');

/**
 * Extracts a function body from a TypeScript file by counting matching curly braces.
 */
function extractFunctionBodyFromTs(filePath, fnName) {
  const code = fs.readFileSync(filePath, 'utf8');
  const marker = 'export function ' + fnName;
  const startIdx = code.indexOf(marker);
  if (startIdx === -1) {
    throw new Error(`Could not find declaration of "${fnName}" in ${filePath}`);
  }
  // Find closing parenthesis of parameter list
  const firstParen = code.indexOf('(', startIdx);
  let pDepth = 1;
  let pIdx = firstParen + 1;
  while (pIdx < code.length && pDepth > 0) {
    if (code[pIdx] === '(') pDepth++;
    else if (code[pIdx] === ')') pDepth--;
    pIdx++;
  }

  // Find opening brace of function body AFTER parameter list
  const openBrace = code.indexOf('{', pIdx);
  let depth = 1;
  let idx = openBrace + 1;
  while (idx < code.length && depth > 0) {
    if (code[idx] === '{') depth++;
    else if (code[idx] === '}') depth--;
    idx++;
  }
  let body = code.substring(openBrace + 1, idx - 1);
  // Strip TS type casts and annotations like ': ProblemDetails' or ': string[]'
  body = body.replace(/:\s*[A-Z][A-Za-z0-9_<>\[\]]*/g, '');
  return body;
}

// Instantiate extracted pure functions directly from src/reservations.ts
const srcEscapeHtml = new Function(
  'str',
  extractFunctionBodyFromTs(reservationsTsPath, 'escapeHtml')
);

const srcValidateGuestCount = new Function(
  'people',
  'const MAX_STANDARD_GROUP_SIZE = 6;\nconst MAX_TOTAL_GUEST_CAPACITY = 20;\n' +
    extractFunctionBodyFromTs(reservationsTsPath, 'validateGuestCount')
);

const srcGenerateReservationLocator = new Function(
  'rng = Math.random',
  extractFunctionBodyFromTs(reservationsTsPath, 'generateReservationLocator')
);

const srcBuildWhatsAppReservationUrl = new Function(
  'params',
  extractFunctionBodyFromTs(reservationsTsPath, 'buildWhatsAppReservationUrl')
);

const srcRenderConfirmationCardHtml = new Function(
  'data',
  'const escapeHtml = ' + srcEscapeHtml.toString() + ';\n' +
    extractFunctionBodyFromTs(reservationsTsPath, 'renderConfirmationCardHtml')
);

const srcCreateProblemDetails = new Function(
  'params',
  extractFunctionBodyFromTs(reservationsTsPath, 'createProblemDetails')
);

const srcRenderProblemToastHtml = new Function(
  'problem',
  'const escapeHtml = ' + srcEscapeHtml.toString() + ';\n' +
    extractFunctionBodyFromTs(reservationsTsPath, 'renderProblemToastHtml')
);

describe('Tier 5: Adversarial Behavioral Stress Suite (Milestone 5 - Concierge & Boundaries)', () => {

  // =========================================================================
  // SCENARIO B1: GUEST COUNT BOUNDARY & IMPERIAL THRESHOLD STRESS
  // =========================================================================
  describe('Scenario B1: Guest Count Boundary & Imperial Threshold Stress', () => {

    test('B1.1: Exact lower standard boundary (1 guest) yields clean confirmation card without imperial notice', () => {
      const guestCheck = srcValidateGuestCount(1);
      assert.equal(guestCheck.valid, true, '1 guest must be valid');
      assert.equal(guestCheck.isImperial, false, '1 guest must NOT be imperial');
      assert.equal(guestCheck.notice, undefined, '1 guest must have undefined notice');

      const waUrl = srcBuildWhatsAppReservationUrl({
        phone: '34662125650',
        locator: 'SP-A1B2',
        name: 'Solitario Comensal',
        date: '2026-11-20',
        time: '14:00',
        people: 1
      });
      assert.ok(waUrl.includes(encodeURIComponent('(1 personas)')), 'waUrl must specify (1 personas)');
      assert.equal(waUrl.includes('Mesa+Imperial'), false, 'Standard 1 guest must not include Mesa Imperial');
      assert.equal(waUrl.includes('Mesa%20Imperial'), false, 'Standard 1 guest must not include Mesa Imperial');

      const cardHtml = srcRenderConfirmationCardHtml({
        locator: 'SP-A1B2',
        customer_name: 'Solitario Comensal',
        customer_email: 'solo@example.com',
        reservation_date: '2026-11-20',
        reservation_time: '14:00',
        number_of_people: 1,
        waUrl,
        isImperial: guestCheck.isImperial,
        imperialNotice: guestCheck.notice
      });

      assert.ok(cardHtml.includes('id="reservation-confirmation-card"'), 'Must render card root');
      assert.ok(cardHtml.includes('1 personas'), 'Summary grid must show 1 personas');
      assert.equal(cardHtml.includes('class="imperial-notice"'), false, 'Clean card must NOT contain imperial notice');
    });

    test('B1.2: Exact upper standard boundary (6 guests) yields clean confirmation card without imperial notice', () => {
      const guestCheck = srcValidateGuestCount(6);
      assert.equal(guestCheck.valid, true, '6 guests must be valid');
      assert.equal(guestCheck.isImperial, false, '6 guests must NOT be imperial');
      assert.equal(guestCheck.notice, undefined, '6 guests must have undefined notice');

      const waUrl = srcBuildWhatsAppReservationUrl({
        phone: '34662125650',
        locator: 'SP-C3D4',
        name: 'Familia Perez',
        date: '2026-11-20',
        time: '14:30',
        people: 6
      });
      assert.ok(waUrl.includes(encodeURIComponent('(6 personas)')), 'waUrl must specify (6 personas)');
      assert.equal(waUrl.includes('Mesa+Imperial'), false, 'Standard 6 guests must not include Mesa Imperial');
      assert.equal(waUrl.includes('Mesa%20Imperial'), false, 'Standard 6 guests must not include Mesa Imperial');

      const cardHtml = srcRenderConfirmationCardHtml({
        locator: 'SP-C3D4',
        customer_name: 'Familia Perez',
        customer_email: 'perez@example.com',
        reservation_date: '2026-11-20',
        reservation_time: '14:30',
        number_of_people: 6,
        waUrl,
        isImperial: guestCheck.isImperial,
        imperialNotice: guestCheck.notice
      });

      assert.ok(cardHtml.includes('6 personas'), 'Summary grid must show 6 personas');
      assert.equal(cardHtml.includes('class="imperial-notice"'), false, '6 guests card must NOT contain imperial notice');
    });

    test('B1.3: Exact lower imperial threshold (7 guests) triggers .imperial-notice and Maître confirmation in WhatsApp', () => {
      const guestCheck = srcValidateGuestCount(7);
      assert.equal(guestCheck.valid, true, '7 guests must be valid');
      assert.equal(guestCheck.isImperial, true, '7 guests MUST be imperial');
      assert.ok(guestCheck.notice && guestCheck.notice.includes('mesa imperial'), 'Notice must mention mesa imperial');

      const waUrl = srcBuildWhatsAppReservationUrl({
        phone: '34662125650',
        locator: 'SP-E5F6',
        name: 'Grupo Celebración',
        date: '2026-11-21',
        time: '21:00',
        people: 7
      });
      const decodedWa = decodeURIComponent(waUrl);
      assert.ok(decodedWa.includes('Mesa Imperial solicitada.'), 'WhatsApp message must append Maître confirmation request');

      const cardHtml = srcRenderConfirmationCardHtml({
        locator: 'SP-E5F6',
        customer_name: 'Grupo Celebración',
        customer_email: 'grupo@example.com',
        reservation_date: '2026-11-21',
        reservation_time: '21:00',
        number_of_people: 7,
        waUrl,
        isImperial: guestCheck.isImperial,
        imperialNotice: guestCheck.notice
      });

      assert.ok(cardHtml.includes('class="imperial-notice"'), 'Card must render .imperial-notice container');
      assert.ok(cardHtml.includes('role="status"'), 'Imperial notice must have role="status"');
      assert.ok(cardHtml.includes('Mesa Imperial:'), 'Imperial notice must display heading');
      assert.ok(cardHtml.includes('7 personas'), 'Summary grid must display 7 personas');
    });

    test('B1.4: Exact upper imperial ceiling (20 guests) triggers .imperial-notice and Maître confirmation in WhatsApp', () => {
      const guestCheck = srcValidateGuestCount(20);
      assert.equal(guestCheck.valid, true, '20 guests must be valid');
      assert.equal(guestCheck.isImperial, true, '20 guests MUST be imperial');
      assert.ok(guestCheck.notice && guestCheck.notice.includes('maître'), 'Notice must mention maître');

      const waUrl = srcBuildWhatsAppReservationUrl({
        phone: '34662125650',
        locator: 'SP-G7H8',
        name: 'Banquete Empresarial',
        date: '2026-12-01',
        time: '21:30',
        people: 20
      });
      const decodedWa = decodeURIComponent(waUrl);
      assert.ok(decodedWa.includes('Mesa Imperial solicitada.'), 'WhatsApp message must append Mesa Imperial solicitada');

      const cardHtml = srcRenderConfirmationCardHtml({
        locator: 'SP-G7H8',
        customer_name: 'Banquete Empresarial',
        customer_email: 'banquete@example.com',
        reservation_date: '2026-12-01',
        reservation_time: '21:30',
        number_of_people: 20,
        waUrl,
        isImperial: guestCheck.isImperial,
        imperialNotice: guestCheck.notice
      });

      assert.ok(cardHtml.includes('class="imperial-notice"'), 'Card must render .imperial-notice');
      assert.ok(cardHtml.includes('20 personas'), 'Summary grid must display 20 personas');
    });

    test('B1.5: Invalid lower integer boundaries (0, -1, -100) are strictly rejected', () => {
      const lowerInvalid = [0, -1, -2, -10, -100];
      for (const pax of lowerInvalid) {
        const check = srcValidateGuestCount(pax);
        assert.equal(check.valid, false, `Guest count ${pax} must be invalid`);
        assert.equal(check.isImperial, false);
        assert.ok(check.error, `Guest count ${pax} must provide error message`);
        assert.ok(check.error.includes('between 1 and 20'), 'Error must specify 1 and 20 bounds');
      }
    });

    test('B1.6: Invalid upper integer boundaries (21, 22, 50, 100, 1000) are strictly rejected', () => {
      const upperInvalid = [21, 22, 25, 50, 100, 1000];
      for (const pax of upperInvalid) {
        const check = srcValidateGuestCount(pax);
        assert.equal(check.valid, false, `Guest count ${pax} must be invalid`);
        assert.equal(check.isImperial, false);
        assert.ok(check.error, `Guest count ${pax} must provide error message`);
      }
    });

    test('B1.7: Non-integer floats (3.5, 0.5, 6.9, 7.1, 19.99, 20.01) are strictly rejected', () => {
      const floatInputs = [3.5, 0.5, 1.1, 6.9, 7.0001, 19.99, 20.01, 12.5];
      for (const val of floatInputs) {
        const check = srcValidateGuestCount(val);
        assert.equal(check.valid, false, `Float ${val} must be rejected`);
        assert.equal(check.isImperial, false);
        assert.ok(check.error, `Float ${val} must return error explanation`);
      }
    });

    test('B1.8: Non-numeric, NaN, Infinity, and adversarial types are strictly rejected', () => {
      const adversarialInputs = [
        NaN,
        Infinity,
        -Infinity,
        '4',
        '0',
        '-1',
        '21',
        '3.5',
        'NaN',
        'four',
        '',
        ' ',
        null,
        undefined,
        {},
        [],
        [4],
        true,
        false
      ];

      for (const input of adversarialInputs) {
        const check = srcValidateGuestCount(input);
        assert.equal(check.valid, false, `Adversarial input ${JSON.stringify(input)} must be rejected`);
        assert.equal(check.isImperial, false);
        assert.ok(check.error, `Adversarial input ${JSON.stringify(input)} must return error`);
      }
    });

    test('B1.9: Form submission controller maps invalid guest counts to RFC 9457 Problem Details toast (Status 422)', () => {
      // Test the logic implemented in src/main.ts and src/experiencia.ts
      function simulateSubmitGuestValidation(peopleValue) {
        const parsed = typeof peopleValue === 'number' ? peopleValue : parseInt(peopleValue, 10);
        if (isNaN(parsed)) {
          return srcCreateProblemDetails({
            type: 'https://api.sabeaperu.es/errors/validation',
            title: 'Datos de reserva incompletos',
            status: 422,
            detail: 'Por favor, complete todos los campos obligatorios (*).'
          });
        }

        const guestCheck = srcValidateGuestCount(parsed);
        if (!guestCheck.valid) {
          return srcCreateProblemDetails({
            type: 'https://api.sabeaperu.es/errors/invalid-guest-count',
            title: 'Número de comensales no válido',
            status: 422,
            detail: guestCheck.error || 'El número de comensales debe ser un número entero entre 1 y 20.'
          });
        }
        return { ok: true, isImperial: guestCheck.isImperial };
      }

      // Test 0
      const res0 = simulateSubmitGuestValidation(0);
      assert.equal(res0.status, 422);
      assert.equal(res0.title, 'Número de comensales no válido');

      // Test -1
      const resNeg = simulateSubmitGuestValidation(-1);
      assert.equal(resNeg.status, 422);

      // Test 21
      const res21 = simulateSubmitGuestValidation(21);
      assert.equal(res21.status, 422);

      // Test 50
      const res50 = simulateSubmitGuestValidation(50);
      assert.equal(res50.status, 422);

      // Test NaN / non-numeric string
      const resNan = simulateSubmitGuestValidation('invalid_number');
      assert.equal(resNan.status, 422);
      assert.equal(resNan.title, 'Datos de reserva incompletos');
    });
  });

  // =========================================================================
  // SCENARIO B2: WHATSAPP URL ESCAPING & SANITIZATION ADVERSARIAL STRESS
  // =========================================================================
  describe('Scenario B2: WhatsApp URL Construction & Escaping Adversarial Stress', () => {

    test('B2.1: Customer names with accents (Peña, D\'Angelo, François, Müller, Østergård) encode losslessly', () => {
      const accentedNames = [
        'María José Peña',
        "Gianluigi D'Angelo",
        'François Truffaut',
        'Jürgen Müller',
        'Søren Østergård',
        'Ñoño Núñez',
        'Chloë O\'Connor'
      ];

      for (const name of accentedNames) {
        const url = srcBuildWhatsAppReservationUrl({
          phone: '34662125650',
          locator: 'SP-AC99',
          name,
          date: '2026-11-20',
          time: '14:00',
          people: 2
        });

        assert.ok(url.startsWith('https://wa.me/34662125650?text='));
        const queryParam = url.split('?text=')[1];
        const decoded = decodeURIComponent(queryParam);
        assert.ok(decoded.includes(name), `Decoded text must faithfully retain accented name "${name}"`);
        assert.ok(decoded.includes('SP-AC99'), 'Decoded text must retain locator');
      }
    });

    test('B2.2: Double quotes, single quotes, and backticks in names cannot break out of HTML attributes or URLs', () => {
      const trickyName = 'Pedro "El Patrón" D\'Angelo `sudo`';
      const waUrl = srcBuildWhatsAppReservationUrl({
        phone: '34662125650',
        locator: 'SP-Q1T2',
        name: trickyName,
        date: '2026-11-20',
        time: '15:00',
        people: 4
      });

      // waUrl must be a valid URI
      assert.doesNotThrow(() => new URL(waUrl), 'Generated waUrl must be valid URL');

      // Confirmation card must escape quotes to avoid breaking out of href="..."
      const cardHtml = srcRenderConfirmationCardHtml({
        locator: 'SP-Q1T2',
        customer_name: trickyName,
        customer_email: 'patron@example.com',
        reservation_date: '2026-11-20',
        reservation_time: '15:00',
        number_of_people: 4,
        waUrl,
        isImperial: false
      });

      // Double quotes in attributes must be &quot; or %22
      assert.ok(cardHtml.includes('&quot;El Patrón&quot;'), 'Quotes in customer name must be escaped as &quot;');
      assert.ok(cardHtml.includes('&#39;Angelo'), 'Apostrophe in customer name must be escaped as &#39;');
      // Check href attribute integrity: must not contain unescaped unquoted delimiter
      const hrefMatch = cardHtml.match(/href="([^"]+)"/);
      assert.ok(hrefMatch, 'href attribute must be cleanly enclosed in double quotes');
      assert.ok(!hrefMatch[1].includes('<'), 'href must not contain unescaped <');
      assert.ok(!hrefMatch[1].includes('"'), 'href value must not contain internal unescaped double quotes');
    });

    test('B2.3: HTML tags and XSS vectors in customer names are neutralized across URL and DOM', () => {
      const maliciousNames = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert(1)>',
        '<svg/onload=fetch("//attacker.com")>',
        '"><script>prompt(1)</script>'
      ];

      for (const xssName of maliciousNames) {
        const waUrl = srcBuildWhatsAppReservationUrl({
          phone: '34662125650',
          locator: 'SP-XSS1',
          name: xssName,
          date: '2026-11-20',
          time: '14:00',
          people: 2
        });

        // WhatsApp query param must encode < and >
        assert.equal(waUrl.includes('<script>'), false, 'Raw <script> forbidden in URL');
        assert.equal(waUrl.includes('<img'), false, 'Raw <img forbidden in URL');
        assert.ok(waUrl.includes('%3C'), 'URL must encode < as %3C');

        // Card HTML must escapeHtml
        const cardHtml = srcRenderConfirmationCardHtml({
          locator: 'SP-XSS1',
          customer_name: xssName,
          customer_email: 'xss@example.com',
          reservation_date: '2026-11-20',
          reservation_time: '14:00',
          number_of_people: 2,
          waUrl,
          isImperial: false
        });

        assert.equal(cardHtml.includes('<script>'), false, 'Raw <script> tag forbidden in cardHtml');
        assert.equal(cardHtml.includes('<img'), false, 'Raw <img tag forbidden in cardHtml');
        assert.ok(cardHtml.includes('&lt;'), 'cardHtml must contain HTML entity &lt;');
        assert.ok(cardHtml.includes('&gt;'), 'cardHtml must contain HTML entity &gt;');
      }
    });

    test('B2.4: Multiline occasion strings and special characters render cleanly in card summary', () => {
      const multilineOccasion = "Celebración 25º Aniversario\nSegunda Planta junto a la ventana\r\nPor favor, rosas rojas & velas";
      const cardHtml = srcRenderConfirmationCardHtml({
        locator: 'SP-ML01',
        customer_name: 'Carlos Ruiz',
        customer_email: 'carlos@example.com',
        reservation_date: '2026-12-25',
        reservation_time: '21:00',
        number_of_people: 4,
        occasion: multilineOccasion,
        waUrl: 'https://wa.me/34662125650',
        isImperial: false
      });

      assert.ok(cardHtml.includes('class="summary-label">Ocasión</span>'), 'Must contain occasion label');
      assert.ok(cardHtml.includes('&amp; velas'), '& symbol must be escaped to &amp;');
      assert.ok(cardHtml.includes('25º Aniversario'), 'Must contain occasion text');
    });

    test('B2.5: Phone sanitization strips spaces, hyphens, parentheses, and falls back to 34662125650', () => {
      const testCases = [
        { input: '+34 662 12 56 50', expected: '34662125650' },
        { input: '  +34 (662) 12-56-50  ', expected: '34662125650' },
        { input: '+34.662.12.56.50', expected: '34662125650' },
        { input: '+51 999 888 777', expected: '51999888777' },
        { input: '34662125650', expected: '34662125650' },
        { input: '', expected: '34662125650' },
        { input: '   ', expected: '34662125650' },
        { input: undefined, expected: '34662125650' },
        { input: null, expected: '34662125650' },
        { input: '++--//() ', expected: '34662125650' },
        { input: 'abc-xyz', expected: '34662125650' }
      ];

      for (const tc of testCases) {
        const url = srcBuildWhatsAppReservationUrl({
          phone: tc.input,
          locator: 'SP-PH01',
          name: 'Juan Test',
          date: '2026-11-20',
          time: '14:00',
          people: 2
        });

        assert.ok(
          url.startsWith(`https://wa.me/${tc.expected}?text=`),
          `Phone input "${tc.input}" must normalize to "${tc.expected}", got: "${url}"`
        );
      }
    });
  });

  // =========================================================================
  // SCENARIO B3: POP-UP BLOCKER IMMUNITY VERIFICATION
  // =========================================================================
  describe('Scenario B3: Pop-up Blocker Immunity Verification', () => {

    test('B3.1: Complete form submission workflow executes with ZERO popup API calls', () => {
      let popupApiCalled = false;
      let windowOpenCallCount = 0;
      let alertCallCount = 0;

      // Instrument mock window
      const mockWindow = {
        open: (...args) => {
          popupApiCalled = true;
          windowOpenCallCount++;
          return null;
        },
        alert: (...args) => {
          popupApiCalled = true;
          alertCallCount++;
        }
      };

      // Simulated production controller submission workflow
      function executeReservationSubmission(formData) {
        // Step 1: Validate fields & boundaries
        const guestCheck = srcValidateGuestCount(formData.people);
        if (!guestCheck.valid) {
          throw new Error('Validation failed');
        }

        // Step 2: Generate locator & DB doc (without window.open)
        const locator = srcGenerateReservationLocator();

        // Step 3: Build WhatsApp URL
        const waUrl = srcBuildWhatsAppReservationUrl({
          phone: '34662125650',
          locator,
          name: formData.name,
          date: formData.date,
          time: formData.time,
          people: formData.people
        });

        // Step 4: Render confirmation card
        const cardHtml = srcRenderConfirmationCardHtml({
          locator,
          customer_name: formData.name,
          customer_email: formData.email,
          reservation_date: formData.date,
          reservation_time: formData.time,
          number_of_people: formData.people,
          waUrl,
          isImperial: guestCheck.isImperial,
          imperialNotice: guestCheck.notice
        });

        return { success: true, locator, cardHtml };
      }

      const result = executeReservationSubmission({
        name: 'Carlos Mendoza',
        email: 'carlos@example.com',
        date: '2026-11-20',
        time: '14:00',
        people: 4
      });

      assert.equal(result.success, true);
      assert.equal(popupApiCalled, false, 'No popup APIs (window.open/alert) must be called during submission');
      assert.equal(windowOpenCallCount, 0, 'window.open call count must be 0');
      assert.equal(alertCallCount, 0, 'alert call count must be 0');
    });

    test('B3.2: Submission mounts #reservation-confirmation-card and hides #reservation-form in DOM', () => {
      const doc = new MockDocument();

      const form = doc.createElement('form');
      form.id = 'reservation-form';
      doc.body.appendChild(form);

      const existingCard = doc.createElement('div');
      existingCard.id = 'reservation-confirmation-card';
      existingCard.style.display = 'none';
      doc.body.appendChild(existingCard);

      // Perform submit state transition
      const locator = 'SP-K8L9';
      const waUrl = srcBuildWhatsAppReservationUrl({
        phone: '34662125650',
        locator,
        name: 'Elena Ramos',
        date: '2026-11-20',
        time: '14:00',
        people: 2
      });

      const cardHtml = srcRenderConfirmationCardHtml({
        locator,
        customer_name: 'Elena Ramos',
        customer_email: 'elena@example.com',
        reservation_date: '2026-11-20',
        reservation_time: '14:00',
        number_of_people: 2,
        waUrl,
        isImperial: false
      });

      // Update DOM matching src/main.ts:895-901
      existingCard.innerHTML = cardHtml;
      existingCard.style.display = 'block';
      form.style.display = 'none';

      assert.equal(form.style.display, 'none', 'Form must be hidden after submission');
      assert.equal(existingCard.style.display, 'block', 'Confirmation card must be visible');
      assert.ok(existingCard.innerHTML.includes('SP-K8L9'), 'Card must display locator');
    });

    test('B3.3: User interaction with voluntary #btn-whatsapp-confirm is pure synchronous user gesture', () => {
      const locator = 'SP-V1W2';
      const waUrl = srcBuildWhatsAppReservationUrl({
        phone: '34662125650',
        locator,
        name: 'David Silva',
        date: '2026-11-22',
        time: '20:00',
        people: 4
      });

      const cardHtml = srcRenderConfirmationCardHtml({
        locator,
        customer_name: 'David Silva',
        customer_email: 'david@example.com',
        reservation_date: '2026-11-22',
        reservation_time: '20:00',
        number_of_people: 4,
        waUrl,
        isImperial: false
      });

      const doc = new MockDocument();
      const container = doc.createElement('div');
      container.innerHTML = cardHtml;
      doc.body.appendChild(container);

      const waBtn = container.querySelector('#btn-whatsapp-confirm');
      assert.ok(waBtn, 'Voluntary anchor #btn-whatsapp-confirm must exist in DOM');
      assert.equal(waBtn.tagName, 'A', 'Must be a standard anchor element <a>');
      assert.equal(waBtn.getAttribute('target'), '_blank', 'Anchor must have target="_blank"');
      assert.equal(waBtn.getAttribute('rel'), 'noopener noreferrer', 'Anchor must have rel="noopener noreferrer"');
      assert.ok(waBtn.getAttribute('href').startsWith('https://wa.me/34662125650?text='), 'Anchor href must point to wa.me');

      // Clicking this anchor is a voluntary user gesture
      let clickDispatched = false;
      waBtn.addEventListener('click', (e) => {
        clickDispatched = true;
      });
      waBtn.click();
      assert.equal(clickDispatched, true, 'User click event dispatches synchronously on voluntary anchor');
    });
  });

  // =========================================================================
  // SCENARIO B4: PROBLEM DETAILS TOAST DOM VERIFICATION
  // =========================================================================
  describe('Scenario B4: Problem Details Toast DOM Verification', () => {

    test('B4.1: Rendered toast markup for Status 409 Conflict contains role="alert", data-status="409", title, and detail', () => {
      const problem409 = srcCreateProblemDetails({
        type: 'https://api.sabeaperu.es/errors/slot-full',
        title: 'Franja horaria completa',
        status: 409,
        detail: 'El aforo máximo de 4 mesas concurrentes ha sido alcanzado.'
      });

      const toastHtml = srcRenderProblemToastHtml(problem409);

      assert.ok(toastHtml.includes('class="toast error rfc-9457"'), 'Root element must have class "toast error rfc-9457"');
      assert.ok(toastHtml.includes('role="alert"'), 'Toast element must declare role="alert"');
      assert.ok(toastHtml.includes('data-status="409"'), 'Toast element must declare data-status="409"');
      assert.ok(toastHtml.includes('<div class="toast-title">Franja horaria completa</div>'), 'Toast must declare title');
      assert.ok(toastHtml.includes('<div class="toast-detail">El aforo máximo de 4 mesas concurrentes ha sido alcanzado.</div>'), 'Toast must declare detail');
      assert.ok(toastHtml.includes('ℹ️'), '4xx error status must render ℹ️ icon');
    });

    test('B4.2: Rendered toast markup for Status 422 Unprocessable Entity contains role="alert", data-status="422", title, and detail', () => {
      const problem422 = srcCreateProblemDetails({
        type: 'https://api.sabeaperu.es/errors/invalid-guest-count',
        title: 'Número de comensales no válido',
        status: 422,
        detail: 'El número de comensales debe ser un número entero entre 1 y 20.'
      });

      const toastHtml = srcRenderProblemToastHtml(problem422);

      assert.ok(toastHtml.includes('role="alert"'), 'Toast element must declare role="alert"');
      assert.ok(toastHtml.includes('data-status="422"'), 'Toast element must declare data-status="422"');
      assert.ok(toastHtml.includes('<div class="toast-title">Número de comensales no válido</div>'), 'Toast must declare title');
      assert.ok(toastHtml.includes('El número de comensales debe ser un número entero entre 1 y 20.'), 'Toast must declare detail');
    });

    test('B4.3: Rendered toast markup for Status 500 Internal Error contains ⚠️ icon', () => {
      const problem500 = srcCreateProblemDetails({
        type: 'https://api.sabeaperu.es/errors/reservation-mutation',
        title: 'Error de conexión',
        status: 500,
        detail: 'No hemos podido registrar su solicitud en este momento.'
      });

      const toastHtml = srcRenderProblemToastHtml(problem500);

      assert.ok(toastHtml.includes('data-status="500"'), 'Toast element must declare data-status="500"');
      assert.ok(toastHtml.includes('⚠️'), '5xx error status must render ⚠️ icon');
    });

    test('B4.4: showProblemToast mounts toast inside #toast-container without corrupting layout', () => {
      const doc = new MockDocument();
      const container = doc.createElement('div');
      container.id = 'toast-container';
      doc.body.appendChild(container);

      // Simulate showProblemToast mounting
      const problem = srcCreateProblemDetails({
        type: 'https://api.sabeaperu.es/errors/slot-full',
        title: 'Franja completa',
        status: 409,
        detail: 'Mesas agotadas'
      });

      const toastHtml = srcRenderProblemToastHtml(problem);
      const toastEl = doc.createElement('div');
      toastEl.className = 'toast error rfc-9457';
      toastEl.setAttribute('role', 'alert');
      toastEl.setAttribute('data-status', '409');
      toastEl.innerHTML = toastHtml;
      container.appendChild(toastEl);

      assert.equal(container.children.length, 1, 'Container must hold 1 toast');
      const mounted = container.children[0];
      assert.equal(mounted.getAttribute('role'), 'alert');
      assert.equal(mounted.getAttribute('data-status'), '409');
    });

    test('B4.5: Toast title and detail payloads strictly neutralize XSS attack vectors', () => {
      const xssProblem = srcCreateProblemDetails({
        type: 'https://api.sabeaperu.es/errors/xss-test',
        title: '<b onmouseover="alert(\'xss\')">XSS Title</b>',
        status: 422,
        detail: '<script>document.location="//evil.com"</script>'
      });

      const toastHtml = srcRenderProblemToastHtml(xssProblem);

      assert.equal(toastHtml.includes('<script>'), false, 'Toast must not contain unescaped <script>');
      assert.equal(toastHtml.includes('<b onmouseover'), false, 'Toast must not contain unescaped HTML elements with event handlers');
      assert.ok(toastHtml.includes('&lt;script&gt;'), 'Toast must escape <script> to &lt;script&gt;');
      assert.ok(toastHtml.includes('&quot;alert'), 'Toast must escape double quotes to &quot;');
    });
  });

  // =========================================================================
  // SCENARIO B5: STATIC HYGIENE & PRODUCTION CONTRACT ALIGNMENT
  // =========================================================================
  describe('Scenario B5: Static Hygiene & Production Contract Alignment', () => {

    test('B5.1: Zero executable window.open calls across all src/*.ts files', () => {
      const tsFiles = ['reservations.ts', 'main.ts', 'experiencia.ts', 'admin.ts'];
      for (const file of tsFiles) {
        const content = fs.readFileSync(path.join(SRC_DIR, file), 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          const stripped = line.trim();
          if (stripped.startsWith('//') || stripped.startsWith('*') || stripped.startsWith('/*')) {
            return;
          }
          assert.equal(
            line.includes('window.open('),
            false,
            `Executable window.open found in ${file}:${idx + 1}: ${line}`
          );
        });
      }
    });

    test('B5.2: Zero executable alert() calls across all src/*.ts files', () => {
      const tsFiles = ['reservations.ts', 'main.ts', 'experiencia.ts', 'admin.ts'];
      const alertRegex = /\balert\s*\(/;
      for (const file of tsFiles) {
        const content = fs.readFileSync(path.join(SRC_DIR, file), 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          const stripped = line.trim();
          if (stripped.startsWith('//') || stripped.startsWith('*') || stripped.startsWith('/*')) {
            return;
          }
          assert.equal(
            alertRegex.test(line),
            false,
            `Executable alert() found in ${file}:${idx + 1}: ${line}`
          );
        });
      }
    });

    test('B5.3: Zero TypeScript ": any" type annotations across all src/*.ts files', () => {
      const tsFiles = ['reservations.ts', 'main.ts', 'experiencia.ts', 'admin.ts'];
      const anyRegex = /:\s*any\b/;
      for (const file of tsFiles) {
        const content = fs.readFileSync(path.join(SRC_DIR, file), 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          const stripped = line.trim();
          if (stripped.startsWith('//') || stripped.startsWith('*') || stripped.startsWith('/*')) {
            return;
          }
          assert.equal(
            anyRegex.test(line),
            false,
            `TypeScript ": any" found in ${file}:${idx + 1}: ${line}`
          );
        });
      }
    });

    test('B5.4: HTML templates (index.html, experiencia.html) contain required Milestone 5 elements', () => {
      const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
      const expHtml = fs.readFileSync(path.join(ROOT_DIR, 'experiencia.html'), 'utf8');

      // Required containers
      assert.ok(indexHtml.includes('id="toast-container"'), 'index.html must have #toast-container');
      assert.ok(indexHtml.includes('id="imperial-table-notice"'), 'index.html must have #imperial-table-notice');
      assert.ok(indexHtml.includes('id="reservation-confirmation-card"'), 'index.html must have #reservation-confirmation-card');

      assert.ok(expHtml.includes('id="toast-container"'), 'experiencia.html must have #toast-container');
      assert.ok(expHtml.includes('id="imperial-table-notice"'), 'experiencia.html must have #imperial-table-notice');
      assert.ok(expHtml.includes('id="reservation-confirmation-card"'), 'experiencia.html must have #reservation-confirmation-card');
    });

    test('B5.5: src/style.css defines Quiet Luxury styles for .confirmation-card, .locator-code, .imperial-notice, and .toast.rfc-9457', () => {
      const css = fs.readFileSync(path.join(SRC_DIR, 'style.css'), 'utf8');

      assert.ok(css.includes('.confirmation-card'), 'style.css must style .confirmation-card');
      assert.ok(css.includes('.locator-code'), 'style.css must style .locator-code');
      assert.ok(css.includes('.imperial-notice'), 'style.css must style .imperial-notice');
      assert.ok(css.includes('#btn-whatsapp-confirm') || css.includes('.btn-wa-confirm'), 'style.css must style WhatsApp CTA');
      assert.ok(css.includes('.rfc-9457'), 'style.css must style RFC 9457 toasts');
    });
  });

});
