# 5-Component Adversarial Challenge Report: Milestone 1 (Scroll & Lifecycle Stress)

**Agent:** `m1_challenger_1` (M1 Challenger - Scroll & Lifecycle Stress)  
**Milestone:** Milestone 1 (Fase 1: Rendimiento Web y Saneamiento de Assets)  
**Parent Task ID / Recipient:** `ed44eb6a-a075-4b06-a258-caefe2915195`  
**Timestamp:** 2026-10-09T18:29:00Z  
**Verdict:** **APPROVE**

---

## 1. Observation

Direct observations, execution metrics, and verbatim outputs gathered during empirical stress testing:

1. **Pipeline & TypeScript Strict Compilation:**
   - Command: `npm run pipeline` (`tsc --noEmit && vite build`)
   - Result: Exit Code 0 in 1.22s.
   - Bundle output:
     - `dist/index.html`: 22.22 kB (gzip: 5.59 kB)
     - `dist/carta.html`: 8.67 kB (gzip: 2.48 kB)
     - `dist/experiencia.html`: 16.35 kB (gzip: 4.08 kB)
     - `dist/admin.html`: 31.73 kB (gzip: 5.28 kB)
     - `dist/assets/style-Du4vC3qa.css`: 26.59 kB (gzip: 6.43 kB)
     - `dist/assets/main-B2cEOey1.js`: 16.96 kB (gzip: 6.61 kB)
     - `dist/assets/firebase-BC8am6bB.js`: 376.09 kB (gzip: 116.81 kB)
     - Total home initial JS payload: ~124.46 kB gzip (under the 150 kB SLA limit).

2. **Automated Test Suite Status:**
   - Command: `npm test` (`node --test tests/**/*.test.mjs`)
   - Result: **119/119 tests PASS across 30 test suites in 5.54s** (0 failed, 0 cancelled, 0 skipped).
   - Breakdown:
     - Tier 1 (Pipeline & Hygiene): 20/20 PASS
     - Tier 2 (Domain Invariants): 22/22 PASS
     - Tier 3 (DOM Transitions): 25/25 PASS
     - Tier 4 (Customer Journeys): 20/20 PASS
     - Tier 5 (Adversarial Network, CLS & SLA): 17/17 PASS
     - Tier 5 (Challenger Scroll & Lifecycle Stress): 15/15 PASS

3. **Scenario C1: Visibility State Flipping & Interval Leak Stress (`tests/tier5-m1-challenger.test.mjs` lines 21–254):**
   - In `src/main.ts` lines 20–27: Lifecycle handles are declared at top-level `DOMContentLoaded` scope:
     ```typescript
     let startHeroSlideshow = () => {};
     let stopHeroSlideshow = () => {};
     let isHeroInView = true;
     let startAutoScroll = () => {};
     let stopAutoScroll = () => {};
     let isGalleryInView = false;
     ```
   - In `src/main.ts` line 111: `startHeroSlideshow` guards against duplicate intervals:
     ```typescript
     if (heroInterval || heroSlides.length <= 1) return;
     if (document.visibilityState === 'hidden' || !isHeroInView) return;
     ```
   - In `src/main.ts` lines 593–596: `startAutoScroll` guards:
     ```typescript
     startAutoScroll = () => {
       stopAutoScroll(); // ensure no duplicates
       if (document.visibilityState === 'hidden' || !isGalleryInView || isDown) return;
     ```
   - In `src/main.ts` lines 728–736: `visibilitychange` listener:
     ```typescript
     document.addEventListener('visibilitychange', () => {
       if (document.visibilityState === 'hidden') {
         stopHeroSlideshow();
         stopAutoScroll();
       } else {
         if (isHeroInView) startHeroSlideshow();
         if (isGalleryInView) startAutoScroll();
       }
     });
     ```
   - Stress test execution: 100 rapid visibility transitions alternating between `'hidden'` and `'visible'`.
   - Results:
     - When `'hidden'`: active interval count is strictly **0**.
     - When `'visible'`: active interval count is strictly **2** (Hero + Gallery), never accumulating or duplicating.
     - 25 consecutive duplicate `'hidden'` events maintained **0** active intervals.
     - 25 consecutive duplicate `'visible'` events maintained strictly **2** active intervals (no interval multiplication).
     - Net leaked intervals: **0**.

4. **Scenario C2: Scroll Event Flooding & Zero Layout Thrashing (`tests/tier5-m1-challenger.test.mjs` lines 256–380):**
   - In `src/main.ts` lines 147–162:
     ```typescript
     let isScrollTicking = false;
     const onScrollThrottled = () => {
       if (!isScrollTicking) {
         window.requestAnimationFrame(() => {
           if (window.scrollY > 50) {
             header?.classList.add('scrolled');
           } else {
             header?.classList.remove('scrolled');
           }
           isScrollTicking = false;
         });
         isScrollTicking = true;
       }
     };
     window.addEventListener('scroll', onScrollThrottled, { passive: true });
     ```
   - Stress test execution: 500 synthetic `scroll` events dispatched in a tight loop across 30 instrumented DOM elements monitoring `getBoundingClientRect`, `offsetTop`, `offsetHeight`, and `scrollTop`.
   - Results:
     - Layout accessors queried during the 500-event flood: **0** (Zero forced reflows, zero layout thrashing).
     - `requestAnimationFrame` scheduled callbacks: **1** (Throttled: 499 events suppressed by `isScrollTicking` gate).
     - Execution duration for 500 events: **2.52 ms** (< 16.6 ms frame budget).
     - Total `addEventListener('scroll'` in `src/main.ts`: strictly **1**, with `{ passive: true }`.

5. **Observer Unobserving Behavior (`tests/tier5-m1-challenger.test.mjs` lines 382–475):**
   - In `src/main.ts` lines 205–222:
     ```typescript
     const revealElements = document.querySelectorAll('.reveal:not(.active)');
     if ('IntersectionObserver' in window) {
       const revealObserver = new IntersectionObserver((entries, obs) => {
         entries.forEach(entry => {
           if (entry.isIntersecting) {
             entry.target.classList.add('active');
             obs.unobserve(entry.target);
           }
         });
       }, { rootMargin: '0px 0px -80px 0px', threshold: 0.1 });
       revealElements.forEach(el => revealObserver.observe(el));
     }
     ```
   - Stress test execution: 10 elements monitored; 5 activated, 1 non-intersecting, 4 activated.
   - Results:
     - Every element with `isIntersecting: true` immediately calls `obs.unobserve(entry.target)`.
     - Observed element count drops from 10 to 5, and finally to 0 once all elements enter view.
     - Elements already bearing `.active` at initialization are filtered by `.reveal:not(.active)` and never observed.
     - Section scroll spy updates active tabs without querying `section.offsetTop`.

---

## 2. Logic Chain

1. **Lifecycle Timer Safety (Observation 3 -> R1 / [DT-04]):**
   - Hoisting `startHeroSlideshow`, `stopHeroSlideshow`, `startAutoScroll`, and `stopAutoScroll` to top-level `DOMContentLoaded` scope ensures the global `visibilitychange` listener has access without encountering `TS2304` runtime reference errors.
   - The dual defense of `heroInterval` null-checking in `startHeroSlideshow` and explicit `stopAutoScroll()` at the start of `startAutoScroll` mathematically guarantees that at most one timer can run per feature at any given moment.
   - When tab visibility flips to `'hidden'`, both timers are cancelled via `clearInterval` and assigned `null`.
   - Under 100 rapid visibility transitions, zero handles leak and active timer count returns to 0 on hidden, completely satisfying [DT-04].

2. **Zero Layout Thrashing & Frame Stability (Observation 4 -> R1 / [DT-09]):**
   - In the legacy code, scrolling triggered synchronous calls to `getBoundingClientRect()` across all `.reveal` nodes and `offsetTop` across all sections, causing forced synchronous reflows.
   - In the refactored code, `.reveal` and section spy were migrated 100% to passive `IntersectionObserver` instances.
   - The only remaining scroll listener is the sticky header, which uses `{ passive: true }` and an atomic boolean lock (`isScrollTicking`) wrapping `requestAnimationFrame`.
   - Flooding 500 scroll events resulted in 0 queries to geometry properties (`getBoundingClientRect`, `offsetTop`), proving forced synchronous reflows are eradicated.

3. **Compositor & Observer Memory Deallocation (Observation 5 -> R1 / [DT-09]):**
   - The `revealObserver` callback invokes `obs.unobserve(entry.target)` immediately upon element intersection.
   - Once all `.reveal` elements have entered the viewport, the observed set reaches size 0. The browser engine can discard tracking structures, preventing long-term heap growth during long user sessions.

4. **Production Build & Verification Non-Regression (Observations 1 & 2 -> Criteria):**
   - `npm run pipeline` compiles with strict TypeScript bundler mode and zero errors.
   - All 119 unit, invariant, DOM, customer journey, and stress tests pass with 100% success rate.
   - Zero Supabase references exist in production source code and HTML templates.

---

## 3. Caveats

- **No Caveats.** All stress tests were executed and empirically reproduced directly against the project codebase. Zero flaky tests or race conditions were detected.

---

## 4. Conclusion

### Adversarial Challenge Summary
- **Overall Risk Assessment:** **LOW**
- **Verdict:** **APPROVE**

Milestone 1 (Fase 1: Rendimiento Web y Saneamiento de Assets) passes all adversarial challenges:
1. **Scenario C1 (Visibility State Flipping):** Passed with 0 leaks, idempotent handling, and proper pause/resume behavior.
2. **Scenario C2 (Scroll Event Flooding):** Passed with 0 layout accessors queried and 100% requestAnimationFrame throttling.
3. **Observer Unobserving:** Passed with immediate unobserving on activation and 0 lingering observed nodes.
4. **Build & Test Suite:** Passed with Exit Code 0 and 119/119 tests passing.

Milestone 1 is certified ready for Milestone 2.

---

## 5. Verification Method

To independently reproduce and verify this challenge report:

1. **Run Full Build Pipeline:**
   ```powershell
   npm run pipeline
   ```
   *Expected Output:* `tsc --noEmit && vite build` completes with **Exit Code 0** in < 2.0s.

2. **Run All Test Suites (119 tests):**
   ```powershell
   npm test
   ```
   *Expected Output:* 119 tests pass across 30 suites with 0 failures.

3. **Run Dedicated Challenger Stress Suite:**
   ```powershell
   node --test tests/tier5-m1-challenger.test.mjs
   ```
   *Expected Output:* 15 tests pass across 4 scenarios (Scenario C1, C2, C3, C4).
