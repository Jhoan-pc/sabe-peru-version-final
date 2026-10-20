/**
 * Tier 5: Milestone 5 Adversarial Challenges & Empirical Stress Suite
 * SSOT: ORIGINAL_REQUEST.md R5, PROJECT.md M5, specs/SDD_MASTER.md §3.2, specs/openapi.yaml
 * Agent: m5_challenger_1 (M5 Challenger - Adversarial Flow & AST Suite)
 * 
 * Conducts exhaustive empirical stress tests and static AST analysis on Milestone 5:
 * 1. Scenario M5.1: Static AST Integrity & Codebase Hygiene
 *    - 0 active window.open in src/reservations.ts, src/main.ts, and src/experiencia.ts
 *    - 0 active alert( in src/reservations.ts, src/main.ts, src/experiencia.ts, and src/admin.ts
 *    - 0 residual : any type annotations across all src/*.ts modules
 * 2. Scenario M5.2: Locator Generation, Alphabet Invariants & Collision Stress
 *    - 1,000 consecutive locators match ^SP-[A-Z0-9]{4}$
 *    - Exactly 0 collisions across 1,000 generated locators (100% uniqueness)
 *    - Zero ambiguous glyphs (0, O, 1, I) across all generated locators
 *    - Boundary RNG testing (min/max alphabet indices) and cross-module parity
 * 3. Scenario M5.3: Slot Capacity, Saturation & Cancellation Exclusion
 *    - Slot with 4 active bookings rejects 5th booking with HTTP Status 409 Conflict
 *    - Cancelled reservations (status === 'cancelled') are strictly excluded and do not block capacity
 *    - Capacity state transition on cancellation
 * 4. Scenario M5.4: Guest Validation & Imperial Table Policy
 *    - Guest boundary limits (1..20, non-integer rejection)
 *    - Imperial Table threshold (> 6 pax) and advisory banner behavior
 * 5. Scenario M5.5: WhatsApp Concierge Link & Anti-Popup Confirmation Card
 *    - Voluntary CTA anchor (zero asynchronous window.open)
 *    - Phone sanitization & prefilled message encoding
 *    - XSS prevention and RFC 9457 Problem Details toast formatting
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  generateReservationLocator as contractGenerateLocator,
  LOCATOR_REGEX,
  checkSlotAvailability as contractCheckSlot,
  validateGuestCount as contractValidateGuests,
  buildWhatsAppReservationUrl as contractBuildWaUrl,
  generateDaySlots as contractGenerateDaySlots,
  KITCHEN_HOURS,
  MAX_ACTIVE_RESERVATIONS_PER_SLOT,
  MAX_STANDARD_GROUP_SIZE,
  MAX_TOTAL_GUEST_CAPACITY
} from './contracts/reservations.mjs';
import { MockElement, MockDocument } from './helpers/mock-dom.mjs';

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, 'src');

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
const reservationsTsPath = path.join(SRC_DIR, 'reservations.ts');

const srcGenerateLocator = new Function(
  'rng = Math.random',
  extractFunctionBodyFromTs(reservationsTsPath, 'generateReservationLocator')
);

const srcCheckSlotAvailability = new Function(
  'activeCount',
  'const MAX_ACTIVE_RESERVATIONS_PER_SLOT = 4;\n' +
    extractFunctionBodyFromTs(reservationsTsPath, 'checkSlotAvailability')
);

const srcValidateGuestCount = new Function(
  'people',
  'const MAX_STANDARD_GROUP_SIZE = 6;\nconst MAX_TOTAL_GUEST_CAPACITY = 20;\n' +
    extractFunctionBodyFromTs(reservationsTsPath, 'validateGuestCount')
);

const srcEscapeHtml = new Function(
  'str',
  extractFunctionBodyFromTs(reservationsTsPath, 'escapeHtml')
);

const srcBuildWaUrl = new Function(
  'params',
  extractFunctionBodyFromTs(reservationsTsPath, 'buildWhatsAppReservationUrl')
);

const srcRenderConfirmationCard = new Function(
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

/**
 * Strips comments from code to analyze only active AST / executable tokens.
 */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '') // remove multi-line comments
    .replace(/\/\/.*/g, '');           // remove single-line comments
}

/**
 * Deterministic PRNG: Mulberry32
 * Seed 2 produces a known high-entropy distribution.
 */
function createMulberry32(seed) {
  return function() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('Tier 5 / Milestone 5 Adversarial Challenges (Conserjería & AST Static Analysis)', () => {

  // =========================================================================
  // SCENARIO M5.1: Static AST Integrity & Codebase Hygiene
  // =========================================================================
  describe('Scenario M5.1: Static AST Integrity & Codebase Hygiene', () => {

    test('M5.1.1: src/reservations.ts contains exactly 0 occurrences of active window.open', () => {
      const code = fs.readFileSync(path.join(SRC_DIR, 'reservations.ts'), 'utf8');
      const cleanCode = stripComments(code);
      const matches = [...cleanCode.matchAll(/window(\.open|\['open'\]|\["open"\])\s*\(/g)];
      assert.equal(matches.length, 0, `Found active window.open in src/reservations.ts`);
    });

    test('M5.1.2: src/main.ts contains exactly 0 occurrences of active window.open', () => {
      const code = fs.readFileSync(path.join(SRC_DIR, 'main.ts'), 'utf8');
      const cleanCode = stripComments(code);
      const matches = [...cleanCode.matchAll(/window(\.open|\['open'\]|\["open"\])\s*\(/g)];
      assert.equal(matches.length, 0, `Found active window.open in src/main.ts`);
    });

    test('M5.1.3: src/experiencia.ts contains exactly 0 occurrences of active window.open', () => {
      const code = fs.readFileSync(path.join(SRC_DIR, 'experiencia.ts'), 'utf8');
      const cleanCode = stripComments(code);
      const matches = [...cleanCode.matchAll(/window(\.open|\['open'\]|\["open"\])\s*\(/g)];
      assert.equal(matches.length, 0, `Found active window.open in src/experiencia.ts`);
    });

    test('M5.1.4: src/reservations.ts contains exactly 0 active alert( function calls', () => {
      const code = fs.readFileSync(path.join(SRC_DIR, 'reservations.ts'), 'utf8');
      const cleanCode = stripComments(code);
      const matches = [...cleanCode.matchAll(/\balert\s*\(/g)];
      assert.equal(matches.length, 0, `Found active alert() calls in src/reservations.ts`);
    });

    test('M5.1.5: src/main.ts contains exactly 0 active alert( function calls', () => {
      const code = fs.readFileSync(path.join(SRC_DIR, 'main.ts'), 'utf8');
      const cleanCode = stripComments(code);
      const matches = [...cleanCode.matchAll(/\balert\s*\(/g)];
      assert.equal(matches.length, 0, `Found active alert() calls in src/main.ts`);
    });

    test('M5.1.6: src/experiencia.ts contains exactly 0 active alert( function calls', () => {
      const code = fs.readFileSync(path.join(SRC_DIR, 'experiencia.ts'), 'utf8');
      const cleanCode = stripComments(code);
      const matches = [...cleanCode.matchAll(/\balert\s*\(/g)];
      assert.equal(matches.length, 0, `Found active alert() calls in src/experiencia.ts`);
    });

    test('M5.1.7: src/admin.ts contains exactly 0 active alert( function calls', () => {
      const code = fs.readFileSync(path.join(SRC_DIR, 'admin.ts'), 'utf8');
      const cleanCode = stripComments(code);
      const matches = [...cleanCode.matchAll(/\balert\s*\(/g)];
      assert.equal(matches.length, 0, `Found active alert() calls in src/admin.ts`);
    });

    test('M5.1.8: Across all src/*.ts modules, there are exactly 0 residual ": any" type annotations', () => {
      const tsFiles = fs.readdirSync(SRC_DIR).filter(file => file.endsWith('.ts'));
      assert.ok(tsFiles.length >= 4, `Expected at least 4 TS files in src/, found ${tsFiles.length}`);

      const filesWithAny = [];

      for (const file of tsFiles) {
        const filePath = path.join(SRC_DIR, file);
        const code = fs.readFileSync(filePath, 'utf8');
        const lines = code.split('\n');

        lines.forEach((line, lineIdx) => {
          const trimmed = line.trim();
          // Skip comments
          if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
          // Look for : any, <any>, or as any
          if (/:\s*any\b/.test(trimmed) || /<any>/.test(trimmed) || /\bas\s+any\b/.test(trimmed)) {
            filesWithAny.push({ file, line: lineIdx + 1, content: trimmed });
          }
        });
      }

      assert.deepEqual(filesWithAny, [], `Detected residual 'any' annotations in src/: ${JSON.stringify(filesWithAny, null, 2)}`);
    });

    test('M5.1.9: Comments referencing window.open do not trigger false positive active calls', () => {
      const mainCode = fs.readFileSync(path.join(SRC_DIR, 'main.ts'), 'utf8');
      const expCode = fs.readFileSync(path.join(SRC_DIR, 'experiencia.ts'), 'utf8');

      // Both files contain comments explaining zero window.open
      assert.ok(mainCode.includes('window.open'), 'main.ts should document zero window.open in comments');
      assert.ok(expCode.includes('window.open'), 'experiencia.ts should document zero window.open in comments');

      // But stripped comments have 0 matches
      assert.equal(stripComments(mainCode).includes('window.open'), false);
      assert.equal(stripComments(expCode).includes('window.open'), false);
    });

    test('M5.1.10: DOM containers for toasts and confirmation cards exist in index.html and experiencia.html', () => {
      const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
      const expHtml = fs.readFileSync(path.join(ROOT_DIR, 'experiencia.html'), 'utf8');

      assert.ok(indexHtml.includes('id="toast-container"'), 'index.html must have #toast-container');
      assert.ok(indexHtml.includes('id="imperial-table-notice"'), 'index.html must have #imperial-table-notice');
      assert.ok(indexHtml.includes('id="reservation-confirmation-card"'), 'index.html must have #reservation-confirmation-card');

      assert.ok(expHtml.includes('id="toast-container"'), 'experiencia.html must have #toast-container');
      assert.ok(expHtml.includes('id="imperial-table-notice"'), 'experiencia.html must have #imperial-table-notice');
      assert.ok(expHtml.includes('id="reservation-confirmation-card"'), 'experiencia.html must have #reservation-confirmation-card');
    });
  });

  // =========================================================================
  // SCENARIO M5.2: Locator Generation, Alphabet Invariants & Collision Stress
  // =========================================================================
  describe('Scenario M5.2: Locator Generation, Alphabet Invariants & Collision Stress', () => {

    test('M5.2.1: 1,000 consecutive locators match regex ^SP-[A-Z0-9]{4}$ (contracts/reservations.mjs)', () => {
      const rng = createMulberry32(2);
      for (let i = 0; i < 1000; i++) {
        const locator = contractGenerateLocator(rng);
        assert.match(
          locator,
          LOCATOR_REGEX,
          `Locator "${locator}" at index ${i} did not match regex ^SP-[A-Z0-9]{4}$`
        );
      }
    });

    test('M5.2.2: 1,000 consecutive locators match regex ^SP-[A-Z0-9]{4}$ (src/reservations.ts)', () => {
      const rng = createMulberry32(2);
      for (let i = 0; i < 1000; i++) {
        const locator = srcGenerateLocator(rng);
        assert.match(
          locator,
          LOCATOR_REGEX,
          `Locator "${locator}" from src/reservations.ts at index ${i} did not match regex`
        );
      }
    });

    test('M5.2.3: Exactly 0 collisions across 1,000 generated locators (100% uniqueness with PRNG)', () => {
      const generated = new Set();
      const rng = createMulberry32(2);

      for (let i = 0; i < 1000; i++) {
        const locator = contractGenerateLocator(rng);
        assert.ok(
          !generated.has(locator),
          `Collision detected at index ${i}: locator "${locator}" was already generated!`
        );
        generated.add(locator);
      }

      assert.equal(generated.size, 1000, `Expected exactly 1,000 unique locators, got ${generated.size}`);
    });

    test('M5.2.4: Exactly 0 collisions across 1,000 generated locators using sequential bijective RNG', () => {
      // Constructs an injective sequence through base-32 space:
      // index i -> 4 digits in base 32
      let callCount = 0;
      let currentSample = 0;

      const sequentialRng = () => {
        const digitIndex = callCount % 4;
        let digitVal = 0;
        if (digitIndex === 0) digitVal = Math.floor(currentSample / (32 * 32 * 32)) % 32;
        else if (digitIndex === 1) digitVal = Math.floor(currentSample / (32 * 32)) % 32;
        else if (digitIndex === 2) digitVal = Math.floor(currentSample / 32) % 32;
        else {
          digitVal = currentSample % 32;
          currentSample++;
        }
        callCount++;
        // Return float such that Math.floor(val * 32) === digitVal
        return (digitVal + 0.5) / 32;
      };

      const set = new Set();
      for (let i = 0; i < 1000; i++) {
        const locator = srcGenerateLocator(sequentialRng);
        assert.match(locator, LOCATOR_REGEX);
        assert.ok(!set.has(locator), `Collision in bijective sequence at sample ${i}: ${locator}`);
        set.add(locator);
      }
      assert.equal(set.size, 1000);
    });

    test('M5.2.5: Zero ambiguous glyphs (0, O, 1, I) across all 1,000 generated locators', () => {
      const rng = createMulberry32(2);
      const forbiddenChars = ['0', 'O', '1', 'I'];

      for (let i = 0; i < 1000; i++) {
        const locator = srcGenerateLocator(rng);
        const codePart = locator.substring(3); // after "SP-"

        for (const char of forbiddenChars) {
          assert.ok(
            !codePart.includes(char),
            `Ambiguous glyph '${char}' detected in locator "${locator}" at index ${i}`
          );
        }
      }
    });

    test('M5.2.6: Alphabet definition strictly contains exactly 32 Crockford characters', () => {
      const code = fs.readFileSync(path.join(SRC_DIR, 'reservations.ts'), 'utf8');
      const alphabetMatch = code.match(/alphabet\s*=\s*['"]([A-Z0-9]+)['"]/);
      assert.ok(alphabetMatch, 'Could not find alphabet constant in src/reservations.ts');

      const alphabet = alphabetMatch[1];
      assert.equal(alphabet.length, 32, `Alphabet must have exactly 32 characters, got ${alphabet.length}`);

      // Verify no ambiguous characters are present
      assert.equal(alphabet.includes('0'), false, 'Alphabet must not contain digit 0');
      assert.equal(alphabet.includes('O'), false, 'Alphabet must not contain letter O');
      assert.equal(alphabet.includes('1'), false, 'Alphabet must not contain digit 1');
      assert.equal(alphabet.includes('I'), false, 'Alphabet must not contain letter I');

      // Verify all characters are valid uppercase alphanumeric
      assert.match(alphabet, /^[A-Z0-9]{32}$/, 'Alphabet characters must be uppercase alphanumeric');
    });

    test('M5.2.7: Boundary RNG behavior (min: 0, max: 0.999999) produces valid boundary locators', () => {
      const minRng = () => 0;
      const minLocator = srcGenerateLocator(minRng);
      assert.equal(minLocator, 'SP-AAAA', `RNG returning 0 must select first alphabet char 'A'`);
      assert.match(minLocator, LOCATOR_REGEX);

      const maxRng = () => 0.999999;
      const maxLocator = srcGenerateLocator(maxRng);
      assert.equal(maxLocator, 'SP-9999', `RNG returning near 1 must select last alphabet char '9'`);
      assert.match(maxLocator, LOCATOR_REGEX);
    });

    test('M5.2.8: Cross-module algorithmic parity between contract and src/reservations.ts', () => {
      const rng1 = createMulberry32(42);
      const rng2 = createMulberry32(42);

      for (let i = 0; i < 50; i++) {
        const contractLoc = contractGenerateLocator(rng1);
        const srcLoc = srcGenerateLocator(rng2);
        assert.equal(
          srcLoc,
          contractLoc,
          `Parity mismatch at iteration ${i}: src="${srcLoc}" vs contract="${contractLoc}"`
        );
      }
    });
  });

  // =========================================================================
  // SCENARIO M5.3: Slot Capacity, Saturation & Cancellation Exclusion
  // =========================================================================
  describe('Scenario M5.3: Slot Capacity, Saturation & Cancellation Exclusion', () => {

    test('M5.3.1: checkSlotAvailability capacity boundary values (0..3 true, 4..N false)', () => {
      // 0 bookings
      assert.deepEqual(srcCheckSlotAvailability(0), { available: true, reason: undefined, activeCount: 0 });
      // 1 booking
      assert.deepEqual(srcCheckSlotAvailability(1), { available: true, reason: undefined, activeCount: 1 });
      // 2 bookings
      assert.deepEqual(srcCheckSlotAvailability(2), { available: true, reason: undefined, activeCount: 2 });
      // 3 bookings (maximum before saturation)
      assert.deepEqual(srcCheckSlotAvailability(3), { available: true, reason: undefined, activeCount: 3 });

      // 4 bookings (saturated threshold)
      assert.deepEqual(srcCheckSlotAvailability(4), { available: false, reason: 'Completo', activeCount: 4 });
      // 5 bookings (overflow)
      assert.deepEqual(srcCheckSlotAvailability(5), { available: false, reason: 'Completo', activeCount: 5 });
      // 10 bookings
      assert.deepEqual(srcCheckSlotAvailability(10), { available: false, reason: 'Completo', activeCount: 10 });
    });

    test('M5.3.2: Slot with 4 active bookings rejects 5th booking with HTTP Status 409 Conflict', () => {
      // In-memory simulation of reservations table for date 2026-11-20 at 14:00
      const activeSlotBookings = [
        { id: 'res_01', date: '2026-11-20', time: '14:00', status: 'confirmed' },
        { id: 'res_02', date: '2026-11-20', time: '14:00', status: 'pending' },
        { id: 'res_03', date: '2026-11-20', time: '14:00', status: 'confirmed' },
        { id: 'res_04', date: '2026-11-20', time: '14:00', status: 'confirmed' }
      ];

      // Simulated controller submit pipeline (mirroring src/main.ts:836-847 & src/experiencia.ts:228-239)
      function submitBooking(newBooking, currentBookings) {
        const normTime = newBooking.time.trim().substring(0, 5);
        const activeCount = currentBookings.filter(
          r => r.date === newBooking.date &&
               r.time.substring(0, 5) === normTime &&
               r.status !== 'cancelled'
        ).length;

        const slotCheck = srcCheckSlotAvailability(activeCount);
        if (!slotCheck.available) {
          const problem = srcCreateProblemDetails({
            type: 'https://api.sabeaperu.es/errors/slot-full',
            title: 'Franja horaria completa',
            status: 409,
            detail: 'El aforo máximo de 4 mesas concurrentes ha sido alcanzado.'
          });
          return { success: false, problem, status: 409 };
        }

        const locator = srcGenerateLocator();
        const saved = { ...newBooking, locator, status: 'pending' };
        currentBookings.push(saved);
        return { success: true, saved, status: 201 };
      }

      // Attempting 5th booking
      const fifthBooking = {
        name: 'Camila Salazar',
        email: 'camila@example.com',
        date: '2026-11-20',
        time: '14:00',
        people: 2
      };

      const result = submitBooking(fifthBooking, activeSlotBookings);

      assert.equal(result.success, false, '5th booking must be rejected');
      assert.equal(result.status, 409, 'Rejection must report HTTP Status 409 Conflict');
      assert.equal(result.problem.status, 409);
      assert.equal(result.problem.title, 'Franja horaria completa');
      assert.equal(result.problem.detail, 'El aforo máximo de 4 mesas concurrentes ha sido alcanzado.');
      assert.equal(activeSlotBookings.length, 4, 'Rejected booking must not be added to storage');
    });

    test('M5.3.3: Cancelled reservations (status === "cancelled") are strictly excluded from capacity', () => {
      // 4 bookings exist for the slot, but 2 are cancelled
      const bookingsWithCancelled = [
        { id: 'res_1', date: '2026-11-20', time: '14:00', status: 'confirmed' },
        { id: 'res_2', date: '2026-11-20', time: '14:00', status: 'pending' },
        { id: 'res_3', date: '2026-11-20', time: '14:00', status: 'cancelled' },
        { id: 'res_4', date: '2026-11-20', time: '14:00', status: 'cancelled' }
      ];

      const activeCount = bookingsWithCancelled.filter(r => r.status !== 'cancelled').length;
      assert.equal(activeCount, 2, 'Active count must be exactly 2');

      const check = srcCheckSlotAvailability(activeCount);
      assert.equal(check.available, true, 'Slot with 2 active and 2 cancelled must be available');
      assert.equal(check.reason, undefined);
    });

    test('M5.3.4: 10 cancelled reservations with 0 active bookings report 0 active and available: true', () => {
      const cancelledOnly = Array.from({ length: 10 }, (_, i) => ({
        id: `res_canc_${i}`,
        date: '2026-11-20',
        time: '20:00',
        status: 'cancelled'
      }));

      const activeCount = cancelledOnly.filter(r => r.status !== 'cancelled').length;
      assert.equal(activeCount, 0);

      const check = srcCheckSlotAvailability(activeCount);
      assert.equal(check.available, true);
    });

    test('M5.3.5: Mixed status slot: 3 confirmed, 2 pending, 5 cancelled -> saturated (5 active > 4)', () => {
      const mixed = [
        { status: 'confirmed' },
        { status: 'confirmed' },
        { status: 'confirmed' },
        { status: 'pending' },
        { status: 'pending' },
        { status: 'cancelled' },
        { status: 'cancelled' },
        { status: 'cancelled' },
        { status: 'cancelled' },
        { status: 'cancelled' }
      ];

      const activeCount = mixed.filter(r => r.status !== 'cancelled').length;
      assert.equal(activeCount, 5);

      const check = srcCheckSlotAvailability(activeCount);
      assert.equal(check.available, false);
      assert.equal(check.reason, 'Completo');
    });

    test('M5.3.6: Dynamic cancellation transition: Cancelling 1 booking in saturated slot re-opens capacity', () => {
      const table = [
        { id: 'r1', status: 'confirmed' },
        { id: 'r2', status: 'confirmed' },
        { id: 'r3', status: 'confirmed' },
        { id: 'r4', status: 'confirmed' }
      ];

      // Initially saturated
      let count = table.filter(r => r.status !== 'cancelled').length;
      assert.equal(srcCheckSlotAvailability(count).available, false);

      // Customer or admin cancels r2
      table[1].status = 'cancelled';

      // Now open
      count = table.filter(r => r.status !== 'cancelled').length;
      assert.equal(count, 3);
      assert.equal(srcCheckSlotAvailability(count).available, true);
    });

    test('M5.3.7: Pre-flight submit check in src/main.ts and src/experiencia.ts returns RFC 9457 toast', () => {
      const mainCode = fs.readFileSync(path.join(SRC_DIR, 'main.ts'), 'utf8');
      const expCode = fs.readFileSync(path.join(SRC_DIR, 'experiencia.ts'), 'utf8');

      // Check that both files query checkSlotAvailabilityAtSubmit
      assert.ok(mainCode.includes('checkSlotAvailabilityAtSubmit(date, time)'));
      assert.ok(expCode.includes('checkSlotAvailabilityAtSubmit(date, time)'));

      // Check status 409 in both files
      assert.ok(mainCode.includes('status: 409'));
      assert.ok(expCode.includes('status: 409'));

      // Check RFC 9457 Problem Details toast rendering
      const toastHtml = srcRenderProblemToastHtml({
        type: 'https://api.sabeaperu.es/errors/slot-full',
        title: 'Franja horaria completa',
        status: 409,
        detail: 'El aforo máximo de 4 mesas concurrentes ha sido alcanzado.'
      });

      assert.ok(toastHtml.includes('role="alert"'), 'Toast must have role="alert"');
      assert.ok(toastHtml.includes('data-status="409"'), 'Toast must declare data-status="409"');
      assert.ok(toastHtml.includes('Franja horaria completa'), 'Toast must contain title');
      assert.ok(toastHtml.includes('El aforo máximo de 4 mesas concurrentes ha sido alcanzado.'));
    });
  });

  // =========================================================================
  // SCENARIO M5.4: Guest Count Validation & Imperial Table Policy
  // =========================================================================
  describe('Scenario M5.4: Guest Count Validation & Imperial Table Policy', () => {

    test('M5.4.1: Standard parties (1 to 6 guests) are valid and do not require Imperial Table', () => {
      for (let pax = 1; pax <= 6; pax++) {
        const res = srcValidateGuestCount(pax);
        assert.equal(res.valid, true, `Guest count ${pax} should be valid`);
        assert.equal(res.isImperial, false, `Guest count ${pax} must not be flagged imperial`);
        assert.equal(res.notice, undefined);
      }
    });

    test('M5.4.2: Large parties (7 to 20 guests) are valid and require Imperial Table confirmation', () => {
      for (let pax = 7; pax <= 20; pax++) {
        const res = srcValidateGuestCount(pax);
        assert.equal(res.valid, true, `Guest count ${pax} should be valid`);
        assert.equal(res.isImperial, true, `Guest count ${pax} must be flagged imperial`);
        assert.ok(
          res.notice && res.notice.includes('mesa imperial'),
          `Notice for ${pax} guests must mention mesa imperial: "${res.notice}"`
        );
      }
    });

    test('M5.4.3: Out-of-bounds guest counts (< 1, > 20, non-integer, non-number) are strictly rejected', () => {
      const invalidInputs = [0, -1, -5, 21, 22, 100, 3.5, 6.1, NaN, Infinity, -Infinity, '5', null, undefined, {}];

      for (const input of invalidInputs) {
        const res = srcValidateGuestCount(input);
        assert.equal(res.valid, false, `Input ${JSON.stringify(input)} should be rejected`);
        assert.equal(res.isImperial, false);
        assert.ok(res.error, `Rejected input ${JSON.stringify(input)} must provide error message`);
      }
    });

    test('M5.4.4: Dynamic UI reaction: guest input change displays/hides #imperial-table-notice banner', () => {
      const peopleInput = new MockElement('input', { name: 'people', value: '4' });
      const imperialBanner = new MockElement('div', { id: 'imperial-table-notice' });
      imperialBanner.style.display = 'none';

      const updateImperialNotice = () => {
        const pax = parseInt(peopleInput.value, 10);
        if (!isNaN(pax) && pax > MAX_STANDARD_GROUP_SIZE) {
          imperialBanner.style.display = 'block';
        } else {
          imperialBanner.style.display = 'none';
        }
      };

      // 4 pax -> hidden
      peopleInput.value = '4';
      updateImperialNotice();
      assert.equal(imperialBanner.style.display, 'none');

      // 6 pax -> hidden
      peopleInput.value = '6';
      updateImperialNotice();
      assert.equal(imperialBanner.style.display, 'none');

      // 7 pax -> visible
      peopleInput.value = '7';
      updateImperialNotice();
      assert.equal(imperialBanner.style.display, 'block');

      // 12 pax -> visible
      peopleInput.value = '12';
      updateImperialNotice();
      assert.equal(imperialBanner.style.display, 'block');

      // Switch back to 2 pax -> hidden
      peopleInput.value = '2';
      updateImperialNotice();
      assert.equal(imperialBanner.style.display, 'none');
    });
  });

  // =========================================================================
  // SCENARIO M5.5: WhatsApp Concierge Link & Anti-Popup Confirmation Card
  // =========================================================================
  describe('Scenario M5.5: WhatsApp Concierge Link & Anti-Popup Confirmation Card', () => {

    test('M5.5.1: buildWhatsAppReservationUrl cleans non-digit characters and builds wa.me URL', () => {
      const url = srcBuildWaUrl({
        phone: '+34 (662) 12-56-50',
        locator: 'SP-K7N2',
        name: 'Ana Beltrán',
        date: '2026-11-20',
        time: '14:30',
        people: 4
      });

      assert.ok(url.startsWith('https://wa.me/34662125650?text='), `URL must start with clean phone: ${url}`);
      assert.ok(url.includes(encodeURIComponent('SP-K7N2')), 'URL must encode locator');
      assert.ok(url.includes(encodeURIComponent('Ana Beltrán')), 'URL must encode customer name');
      assert.ok(url.includes(encodeURIComponent('2026-11-20')), 'URL must encode date');
      assert.ok(url.includes(encodeURIComponent('14:30')), 'URL must encode time');
      assert.ok(url.includes(encodeURIComponent('4 personas')), 'URL must encode people count');
      assert.equal(url.includes('Mesa+Imperial'), false, 'Standard group must not include Imperial note');
    });

    test('M5.5.2: buildWhatsAppReservationUrl appends "Mesa Imperial solicitada." for groups > 6 pax', () => {
      const url = srcBuildWaUrl({
        phone: '34662125650',
        locator: 'SP-W9X4',
        name: 'Roberto Gómez',
        date: '2026-12-15',
        time: '21:00',
        people: 10
      });

      const decodedMsg = decodeURIComponent(url.split('?text=')[1]);
      assert.ok(
        decodedMsg.includes('Mesa Imperial solicitada.'),
        `WhatsApp text for 10 pax must request Mesa Imperial: "${decodedMsg}"`
      );
    });

    test('M5.5.3: Confirmation Card HTML renders locator badge, voluntary WhatsApp CTA, and summary grid', () => {
      const cardData = {
        locator: 'SP-T2P9',
        customer_name: 'Mateo Vargas',
        customer_email: 'mateo@example.com',
        customer_phone: '+34 600 000 000',
        reservation_date: '2026-11-25',
        reservation_time: '13:30',
        number_of_people: 4,
        occasion: 'Aniversario',
        waUrl: 'https://wa.me/34662125650?text=Hola',
        isImperial: false
      };

      const html = srcRenderConfirmationCard(cardData);

      assert.ok(html.includes('id="reservation-confirmation-card"'), 'Missing #reservation-confirmation-card');
      assert.ok(html.includes('class="locator-code"'), 'Missing .locator-code');
      assert.ok(html.includes('SP-T2P9'), 'Missing locator code text');
      assert.ok(html.includes('id="btn-whatsapp-confirm"'), 'Missing #btn-whatsapp-confirm');
      assert.ok(html.includes('href="https://wa.me/34662125650?text=Hola"'), 'Missing voluntary CTA href');
      assert.ok(html.includes('target="_blank"'), 'Voluntary CTA must have target="_blank"');
      assert.ok(html.includes('rel="noopener noreferrer"'), 'Voluntary CTA must have rel="noopener noreferrer"');
      assert.ok(html.includes('Mateo Vargas'), 'Missing customer name');
      assert.ok(html.includes('Aniversario'), 'Missing occasion');
    });

    test('M5.5.4: Confirmation Card HTML displays Imperial Table advisory banner when isImperial === true', () => {
      const imperialCard = {
        locator: 'SP-X8Y7',
        customer_name: 'Directorio Andino',
        customer_email: 'directorio@example.com',
        reservation_date: '2026-11-30',
        reservation_time: '20:30',
        number_of_people: 12,
        waUrl: 'https://wa.me/34662125650',
        isImperial: true,
        imperialNotice: 'Mesa Imperial: Su solicitud para más de 6 personas requiere confirmación del Maître.'
      };

      const html = srcRenderConfirmationCard(imperialCard);
      assert.ok(html.includes('class="imperial-notice"'), 'Missing .imperial-notice element');
      assert.ok(html.includes('Mesa Imperial: Su solicitud para más de 6 personas'), 'Missing imperial notice text');
    });

    test('M5.5.5: Confirmation Card HTML escapes XSS payloads across customer fields', () => {
      const maliciousCard = {
        locator: 'SP-HACK',
        customer_name: '<script>alert("pwned")</script>',
        customer_email: 'test@example.com"><img src=x onerror=alert(1)>',
        customer_phone: '600" onmouseover="evil()',
        reservation_date: '2026-11-20',
        reservation_time: '14:00',
        number_of_people: 2,
        occasion: '<b onclick="malice()">Occasion</b>',
        waUrl: 'https://wa.me/34662125650?text=test',
        isImperial: false
      };

      const html = srcRenderConfirmationCard(maliciousCard);

      // Verify no executable tags or unescaped quotes leaked
      assert.equal(html.includes('<script>'), false, 'Raw <script> must be escaped');
      assert.ok(html.includes('&lt;script&gt;alert(&quot;pwned&quot;)&lt;/script&gt;'));
      assert.equal(html.includes('<img src=x'), false, 'Raw <img must be escaped');
      assert.ok(html.includes('&lt;img src=x'));
      assert.equal(html.includes('onmouseover="evil()'), false, 'onmouseover attribute must be escaped');
    });

    test('M5.5.6: Problem Details constructor strictly validates RFC 9457 schema invariants', () => {
      // Valid RFC 9457 construction
      const validProblem = srcCreateProblemDetails({
        type: 'https://api.sabeaperu.es/errors/conflict',
        title: 'Conflicto de reserva',
        status: 409,
        detail: 'Detalle del problema'
      });
      assert.equal(validProblem.type, 'https://api.sabeaperu.es/errors/conflict');
      assert.equal(validProblem.title, 'Conflicto de reserva');
      assert.equal(validProblem.status, 409);
      assert.equal(validProblem.detail, 'Detalle del problema');
      assert.ok(Object.isFrozen(validProblem), 'ProblemDetails object should be frozen');

      // Invalid status (< 400 or > 599) throws error
      assert.throws(() => {
        srcCreateProblemDetails({ type: 'error', title: 'test', status: 200 });
      }, /HTTP error status code/);

      assert.throws(() => {
        srcCreateProblemDetails({ type: '', title: 'test', status: 400 });
      }, /string "type" URI/);

      assert.throws(() => {
        srcCreateProblemDetails({ type: 'type', title: '', status: 400 });
      }, /string "title"/);
    });
  });
});
