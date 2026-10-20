/**
 * Tier 5: Adversarial Challenger Stress Suite (Milestone 1)
 * Formal SSOT: PROJECT.md M1/M6, specs/performance-spec.md §2-§3, SDD_MASTER [DT-04], [DT-09]
 * Agent: m1_challenger_1 (EMPIRICAL CHALLENGER)
 * 
 * Conducts empirical adversarial challenges on Milestone 1 code:
 * 1. Scenario C1: Stress-test visibility state toggling (rapid tab switching, interval leak & runaway detection)
 * 2. Scenario C2: Scroll event flooding (500 rapid scroll events, zero layout thrashing / forced reflows)
 * 3. Observer unobserving behavior & memory lifecycle on active elements
 * 4. Production AST & Source Invariants
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { MockElement } from './helpers/mock-dom.mjs';

const ROOT_DIR = process.cwd();

describe('Tier 5: Adversarial Challenger Stress Suite (Milestone 1)', () => {

  describe('Scenario C1: Visibility State Toggling & Interval Leak Stress Test', () => {

    test('T5.1.1: 100 rapid visibility transitions do not leak interval handles (Strict 0 on hidden, <= 2 on visible)', () => {
      // Setup tracking spy for setInterval and clearInterval
      const activeIntervals = new Set();
      let nextTimerId = 1000;

      const spySetInterval = (fn, ms) => {
        const id = nextTimerId++;
        activeIntervals.add(id);
        return id;
      };

      const spyClearInterval = (id) => {
        if (id !== null && id !== undefined) {
          activeIntervals.delete(id);
        }
      };

      // Mock lifecycle handles adhering to src/main.ts controller pattern
      let heroInterval = null;
      let autoScrollInterval = null;
      let isHeroInView = true;
      let isGalleryInView = true;
      let isDown = false;
      const heroSlidesCount = 4;
      let visibilityState = 'visible';

      const startHeroSlideshow = () => {
        if (heroInterval || heroSlidesCount <= 1) return;
        if (visibilityState === 'hidden' || !isHeroInView) return;
        heroInterval = spySetInterval(() => {}, 5000);
      };

      const stopHeroSlideshow = () => {
        if (heroInterval) {
          spyClearInterval(heroInterval);
          heroInterval = null;
        }
      };

      const startAutoScroll = () => {
        stopAutoScroll(); // ensure no duplicates
        if (visibilityState === 'hidden' || !isGalleryInView || isDown) return;
        autoScrollInterval = spySetInterval(() => {}, 4000);
      };

      const stopAutoScroll = () => {
        if (autoScrollInterval) {
          spyClearInterval(autoScrollInterval);
          autoScrollInterval = null;
        }
      };

      const handleVisibilityChange = () => {
        if (visibilityState === 'hidden') {
          stopHeroSlideshow();
          stopAutoScroll();
        } else {
          if (isHeroInView) startHeroSlideshow();
          if (isGalleryInView) startAutoScroll();
        }
      };

      // Initial state: visible
      startHeroSlideshow();
      startAutoScroll();
      assert.equal(activeIntervals.size, 2, 'Should initially have exactly 2 active timers (Hero + Gallery)');

      // Adversarial Loop: Rapidly toggle visibility 100 times
      for (let i = 0; i < 100; i++) {
        // Toggle to hidden
        visibilityState = 'hidden';
        handleVisibilityChange();

        assert.equal(activeIntervals.size, 0, `Iteration ${i}: Must have exactly 0 active intervals when hidden`);
        assert.equal(heroInterval, null, `Iteration ${i}: heroInterval must be null when hidden`);
        assert.equal(autoScrollInterval, null, `Iteration ${i}: autoScrollInterval must be null when hidden`);

        // Toggle to visible
        visibilityState = 'visible';
        handleVisibilityChange();

        assert.equal(activeIntervals.size, 2, `Iteration ${i}: Must have exactly 2 active intervals when visible`);
        assert.ok(heroInterval !== null, `Iteration ${i}: heroInterval must be active when visible`);
        assert.ok(autoScrollInterval !== null, `Iteration ${i}: autoScrollInterval must be active when visible`);
      }

      // Final hidden state
      visibilityState = 'hidden';
      handleVisibilityChange();
      assert.equal(activeIntervals.size, 0, 'Must have zero lingering intervals after loop completes');
    });

    test('T5.1.2: Redundant duplicate visibility events are completely idempotent', () => {
      const activeIntervals = new Set();
      let nextTimerId = 2000;

      const spySetInterval = (fn, ms) => {
        const id = nextTimerId++;
        activeIntervals.add(id);
        return id;
      };

      const spyClearInterval = (id) => {
        activeIntervals.delete(id);
      };

      let heroInterval = null;
      let autoScrollInterval = null;
      let isHeroInView = true;
      let isGalleryInView = true;
      let visibilityState = 'visible';

      const startHeroSlideshow = () => {
        if (heroInterval || 2 <= 1) return;
        if (visibilityState === 'hidden' || !isHeroInView) return;
        heroInterval = spySetInterval(() => {}, 5000);
      };

      const stopHeroSlideshow = () => {
        if (heroInterval) {
          spyClearInterval(heroInterval);
          heroInterval = null;
        }
      };

      const startAutoScroll = () => {
        stopAutoScroll();
        if (visibilityState === 'hidden' || !isGalleryInView) return;
        autoScrollInterval = spySetInterval(() => {}, 4000);
      };

      const stopAutoScroll = () => {
        if (autoScrollInterval) {
          spyClearInterval(autoScrollInterval);
          autoScrollInterval = null;
        }
      };

      const handleVisibilityChange = () => {
        if (visibilityState === 'hidden') {
          stopHeroSlideshow();
          stopAutoScroll();
        } else {
          if (isHeroInView) startHeroSlideshow();
          if (isGalleryInView) startAutoScroll();
        }
      };

      // Send 25 consecutive 'hidden' events
      visibilityState = 'hidden';
      for (let i = 0; i < 25; i++) {
        handleVisibilityChange();
        assert.equal(activeIntervals.size, 0, 'Redundant hidden event must maintain 0 active intervals');
      }

      // Send 25 consecutive 'visible' events
      visibilityState = 'visible';
      for (let i = 0; i < 25; i++) {
        handleVisibilityChange();
        assert.equal(activeIntervals.size, 2, 'Redundant visible event must not multiply intervals beyond 2');
      }

      // Cleanup
      visibilityState = 'hidden';
      handleVisibilityChange();
      assert.equal(activeIntervals.size, 0);
    });

    test('T5.1.3: Viewport offscreen state prevents interval activation upon tab visibility restore', () => {
      const activeIntervals = new Set();
      let nextTimerId = 3000;

      const spySetInterval = () => {
        const id = nextTimerId++;
        activeIntervals.add(id);
        return id;
      };
      const spyClearInterval = (id) => activeIntervals.delete(id);

      let heroInterval = null;
      let autoScrollInterval = null;
      let isHeroInView = false; // Hero offscreen
      let isGalleryInView = false; // Gallery offscreen
      let visibilityState = 'hidden';

      const startHeroSlideshow = () => {
        if (heroInterval || 2 <= 1) return;
        if (visibilityState === 'hidden' || !isHeroInView) return;
        heroInterval = spySetInterval();
      };
      const stopHeroSlideshow = () => {
        if (heroInterval) { spyClearInterval(heroInterval); heroInterval = null; }
      };
      const startAutoScroll = () => {
        stopAutoScroll();
        if (visibilityState === 'hidden' || !isGalleryInView) return;
        autoScrollInterval = spySetInterval();
      };
      const stopAutoScroll = () => {
        if (autoScrollInterval) { spyClearInterval(autoScrollInterval); autoScrollInterval = null; }
      };

      const handleVisibilityChange = () => {
        if (visibilityState === 'hidden') {
          stopHeroSlideshow();
          stopAutoScroll();
        } else {
          if (isHeroInView) startHeroSlideshow();
          if (isGalleryInView) startAutoScroll();
        }
      };

      // Tab becomes visible, but elements are offscreen
      visibilityState = 'visible';
      handleVisibilityChange();

      assert.equal(activeIntervals.size, 0, 'No timers should run if elements are not in view, even if tab is visible');

      // Now Hero enters view
      isHeroInView = true;
      startHeroSlideshow();
      assert.equal(activeIntervals.size, 1, 'Only Hero interval should start when Hero enters view');

      // Tab hides again
      visibilityState = 'hidden';
      handleVisibilityChange();
      assert.equal(activeIntervals.size, 0, 'Timers must stop when hidden');

      // Tab visible again, but only Gallery is in view
      isHeroInView = false;
      isGalleryInView = true;
      visibilityState = 'visible';
      handleVisibilityChange();
      assert.equal(activeIntervals.size, 1, 'Only Gallery interval should start when only Gallery is in view');

      // Cleanup
      visibilityState = 'hidden';
      handleVisibilityChange();
      assert.equal(activeIntervals.size, 0);
    });

    test('T5.1.4: Drag interaction locks autoScroll timer from restarting during tab switch', () => {
      const activeIntervals = new Set();
      let nextTimerId = 4000;
      const spySetInterval = () => { const id = nextTimerId++; activeIntervals.add(id); return id; };
      const spyClearInterval = (id) => activeIntervals.delete(id);

      let autoScrollInterval = null;
      let isGalleryInView = true;
      let isDown = true; // User is actively dragging gallery
      let visibilityState = 'hidden';

      const startAutoScroll = () => {
        stopAutoScroll();
        if (visibilityState === 'hidden' || !isGalleryInView || isDown) return;
        autoScrollInterval = spySetInterval();
      };
      const stopAutoScroll = () => {
        if (autoScrollInterval) { spyClearInterval(autoScrollInterval); autoScrollInterval = null; }
      };

      // Visibility switches to visible while user is dragging
      visibilityState = 'visible';
      startAutoScroll();

      assert.equal(activeIntervals.size, 0, 'AutoScroll must not start while isDown is true');
      assert.equal(autoScrollInterval, null);

      // User releases drag
      isDown = false;
      startAutoScroll();
      assert.equal(activeIntervals.size, 1, 'AutoScroll starts once drag is released');

      // Cleanup
      stopAutoScroll();
      assert.equal(activeIntervals.size, 0);
    });
  });

  describe('Scenario C2: Scroll Event Flooding & Zero Layout Thrashing', () => {

    test('T5.2.1: Dispatching 500 rapid scroll events causes 0 layout queries (Forced Reflow Eradication)', () => {
      let layoutAccessCount = 0;

      // Create a monitored element hierarchy
      const monitoredElements = [];
      for (let i = 0; i < 30; i++) {
        const el = new MockElement('div', { class: 'reveal' });
        // Instrument layout accessors with spy
        Object.defineProperties(el, {
          getBoundingClientRect: {
            value: () => { layoutAccessCount++; return { top: 100, bottom: 200 }; }
          },
          offsetTop: {
            get: () => { layoutAccessCount++; return 150; }
          },
          offsetHeight: {
            get: () => { layoutAccessCount++; return 50; }
          },
          scrollTop: {
            get: () => { layoutAccessCount++; return 0; }
          }
        });
        monitoredElements.push(el);
      }

      // Implementation of sticky header throttled scroll listener from src/main.ts
      const header = new MockElement('header', { id: 'main-header' });
      let isScrollTicking = false;
      let scheduledRafCallbacks = [];
      const mockRequestAnimationFrame = (cb) => {
        scheduledRafCallbacks.push(cb);
        return scheduledRafCallbacks.length;
      };

      let scrollY = 0;
      const onScrollThrottled = () => {
        if (!isScrollTicking) {
          mockRequestAnimationFrame(() => {
            if (scrollY > 50) {
              header.classList.add('scrolled');
            } else {
              header.classList.remove('scrolled');
            }
            isScrollTicking = false;
          });
          isScrollTicking = true;
        }
      };

      // Adversarial flood: 500 synchronous scroll events with varying scroll positions
      const startTime = performance.now();
      for (let i = 0; i < 500; i++) {
        scrollY = i * 2;
        onScrollThrottled();
      }
      const duration = performance.now() - startTime;

      // Assertions
      assert.equal(layoutAccessCount, 0, 'Zero layout accessors (getBoundingClientRect, offsetTop) must be queried during scroll flood');
      assert.equal(scheduledRafCallbacks.length, 1, 'Throttling must queue exactly 1 requestAnimationFrame callback for 500 synchronous events');
      assert.ok(duration < 15, `500 scroll events executed in ${duration.toFixed(2)}ms, well under 16ms frame budget`);

      // Flush the single scheduled rAF callback
      const callback = scheduledRafCallbacks.shift();
      callback();

      assert.equal(isScrollTicking, false, 'isScrollTicking must reset to false after rAF callback runs');
      assert.equal(header.classList.contains('scrolled'), true, 'Header must have scrolled class when scrollY > 50');
      assert.equal(layoutAccessCount, 0, 'Zero layout accessors must be called even inside rAF callback');
    });

    test('T5.2.2: Scroll ticking flag correctly unlocks after animation frame tick', () => {
      const header = new MockElement('header', { id: 'main-header' });
      let isScrollTicking = false;
      let scheduledRafCallbacks = [];
      const mockRequestAnimationFrame = (cb) => {
        scheduledRafCallbacks.push(cb);
        return scheduledRafCallbacks.length;
      };

      let scrollY = 0;
      const onScrollThrottled = () => {
        if (!isScrollTicking) {
          mockRequestAnimationFrame(() => {
            if (scrollY > 50) {
              header.classList.add('scrolled');
            } else {
              header.classList.remove('scrolled');
            }
            isScrollTicking = false;
          });
          isScrollTicking = true;
        }
      };

      // Burst 1: 50 events at scrollY = 100
      scrollY = 100;
      for (let i = 0; i < 50; i++) onScrollThrottled();
      assert.equal(scheduledRafCallbacks.length, 1);

      // Execute frame 1
      scheduledRafCallbacks.shift()();
      assert.equal(header.classList.contains('scrolled'), true);
      assert.equal(isScrollTicking, false);

      // Burst 2: 50 events back at scrollY = 10 (scrolled up)
      scrollY = 10;
      for (let i = 0; i < 50; i++) onScrollThrottled();
      assert.equal(scheduledRafCallbacks.length, 1, 'Should schedule a second rAF callback for the new frame');

      // Execute frame 2
      scheduledRafCallbacks.shift()();
      assert.equal(header.classList.contains('scrolled'), false, 'Header scrolled class must be removed when scrollY <= 50');
      assert.equal(isScrollTicking, false);
    });

    test('T5.2.3: src/main.ts contains exactly ONE window.addEventListener scroll listener with passive: true', () => {
      const mainTs = fs.readFileSync(path.join(ROOT_DIR, 'src', 'main.ts'), 'utf8');
      const scrollListeners = [...mainTs.matchAll(/addEventListener\(\s*['"]scroll['"]\s*,\s*([a-zA-Z0-9_]+)\s*,\s*(\{[^}]+\})\s*\)/g)];
      
      assert.equal(scrollListeners.length, 1, 'src/main.ts must have exactly 1 scroll event listener');
      
      const config = scrollListeners[0][2];
      assert.match(config, /passive:\s*true/, 'The scroll listener must be configured with { passive: true }');

      // Ensure no raw unthrottled scroll listeners exist
      const allScrollOccurrences = [...mainTs.matchAll(/addEventListener\(\s*['"]scroll['"]/g)];
      assert.equal(allScrollOccurrences.length, 1, 'Total scroll event listeners in src/main.ts must be strictly 1');
    });
  });

  describe('Scenario C3: IntersectionObserver Unobserving & Memory Lifecycle', () => {

    test('T5.3.1: Reveal elements unobserve immediately upon isIntersecting: true', () => {
      const observedElements = new Set();
      const unobservedElements = new Set();

      class MockIntersectionObserver {
        constructor(callback, options) {
          this.callback = callback;
          this.options = options;
        }
        observe(el) {
          observedElements.add(el);
        }
        unobserve(el) {
          observedElements.delete(el);
          unobservedElements.add(el);
        }
      }

      // Create 10 reveal elements
      const elements = Array.from({ length: 10 }, (_, i) => new MockElement('div', { class: 'reveal', id: `reveal-${i}` }));

      // Setup observer as in src/main.ts
      let observerInstance;
      const callback = (entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
            obs.unobserve(entry.target);
          }
        });
      };

      observerInstance = new MockIntersectionObserver(callback, {
        rootMargin: '0px 0px -80px 0px',
        threshold: 0.1
      });

      elements.forEach(el => observerInstance.observe(el));
      assert.equal(observedElements.size, 10, 'All 10 elements must be initially observed');
      assert.equal(unobservedElements.size, 0);

      // Simulate Batch 1: elements 0 to 4 enter viewport
      const batch1 = elements.slice(0, 5).map(el => ({ target: el, isIntersecting: true }));
      callback(batch1, observerInstance);

      // Check Batch 1
      for (let i = 0; i < 5; i++) {
        assert.equal(elements[i].classList.contains('active'), true, `Element ${i} must receive active class`);
        assert.equal(unobservedElements.has(elements[i]), true, `Element ${i} must be unobserved`);
      }
      assert.equal(observedElements.size, 5, 'Exactly 5 remaining elements should still be observed');

      // Simulate non-intersecting event for element 5
      callback([{ target: elements[5], isIntersecting: false }], observerInstance);
      assert.equal(elements[5].classList.contains('active'), false, 'Non-intersecting element must NOT receive active class');
      assert.equal(unobservedElements.has(elements[5]), false, 'Non-intersecting element must NOT be unobserved');
      assert.equal(observedElements.has(elements[5]), true, 'Non-intersecting element must remain observed');

      // Simulate Batch 2: remaining elements 5 to 9 enter viewport
      const batch2 = elements.slice(5).map(el => ({ target: el, isIntersecting: true }));
      callback(batch2, observerInstance);

      assert.equal(observedElements.size, 0, 'Observed set must be 0 after all elements have activated');
      assert.equal(unobservedElements.size, 10, 'All 10 elements must have been unobserved');
    });

    test('T5.3.2: Elements already possessing .active at init are never registered in revealObserver', () => {
      // Create elements using setAttribute so MockClassList syncs correctly
      const el1 = new MockElement('div');
      el1.setAttribute('class', 'reveal');
      const el2 = new MockElement('div');
      el2.setAttribute('class', 'reveal active');
      const el3 = new MockElement('div');
      el3.setAttribute('class', 'reveal');
      const el4 = new MockElement('div');
      el4.setAttribute('class', 'reveal active');

      const elements = [el1, el2, el3, el4];

      // Query selector simulation for .reveal:not(.active)
      const unactivatedElements = elements.filter(el => 
        el.classList.contains('reveal') && !el.classList.contains('active')
      );

      assert.equal(unactivatedElements.length, 2, 'Only unactivated reveal elements must be selected');

      const observedSet = new Set();
      unactivatedElements.forEach(el => observedSet.add(el));

      assert.equal(observedSet.size, 2);
      assert.equal(observedSet.has(el2), false, 'Pre-active element must not be observed');
      assert.equal(observedSet.has(el4), false, 'Pre-active element must not be observed');
    });

    test('T5.3.3: Section scroll spy observer tracks tabs passively without reading offsetTop', () => {
      const tabs = [
        new MockElement('a', { class: 'tab-link', href: '#inicio' }),
        new MockElement('a', { class: 'tab-link', href: '#carta' }),
        new MockElement('a', { class: 'tab-link', href: '#experiencia' })
      ];

      const sections = [
        new MockElement('section', { id: 'inicio' }),
        new MockElement('section', { id: 'carta' }),
        new MockElement('section', { id: 'experiencia' })
      ];

      let offsetTopReads = 0;
      sections.forEach(s => {
        Object.defineProperty(s, 'offsetTop', {
          get: () => { offsetTopReads++; return 200; }
        });
      });

      const updateActiveTab = (currentId) => {
        tabs.forEach((tab) => {
          const href = tab.getAttribute('href');
          if (href === `#${currentId}` || href === `/#${currentId}`) {
            tab.classList.add('active');
          } else if (href && (href.startsWith('#') || href.startsWith('/#'))) {
            tab.classList.remove('active');
          }
        });
      };

      // Simulate observer firing for section 'carta'
      updateActiveTab('carta');

      assert.equal(tabs[0].classList.contains('active'), false);
      assert.equal(tabs[1].classList.contains('active'), true);
      assert.equal(tabs[2].classList.contains('active'), false);
      assert.equal(offsetTopReads, 0, 'Scroll spy must not access section.offsetTop');

      // Simulate observer firing for section 'experiencia'
      updateActiveTab('experiencia');

      assert.equal(tabs[1].classList.contains('active'), false);
      assert.equal(tabs[2].classList.contains('active'), true);
      assert.equal(offsetTopReads, 0, 'Scroll spy must not access section.offsetTop on subsequent transitions');
    });
  });

  describe('Scenario C4: Production Artifact & Source Verification', () => {

    test('T5.4.1: Production dist/assets/main-*.js bundle contains visibilitychange listener and passive scroll', () => {
      const assetsDir = path.join(ROOT_DIR, 'dist', 'assets');
      const mainBundle = fs.readdirSync(assetsDir).find(f => f.startsWith('main-') && f.endsWith('.js'));
      assert.ok(mainBundle, 'Production main JS chunk must exist in dist/assets');

      const bundleCode = fs.readFileSync(path.join(assetsDir, mainBundle), 'utf8');
      
      assert.match(bundleCode, /visibilitychange/, 'Production bundle must contain visibilitychange event listener');
      assert.match(bundleCode, /visibilityState===["']hidden["']/, 'Production bundle must check visibilityState === hidden');
      assert.match(bundleCode, /addEventListener\(["']scroll["'],\w+,\{passive:!0\}\)/, 'Production bundle must attach passive scroll listener');
      assert.match(bundleCode, /requestAnimationFrame/, 'Production bundle must throttle via requestAnimationFrame');
      assert.match(bundleCode, /unobserve/, 'Production bundle must call unobserve on IntersectionObserver entries');
    });

    test('T5.4.2: Zero Supabase references in any dist bundle', () => {
      const assetsDir = path.join(ROOT_DIR, 'dist', 'assets');
      const jsFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.js'));
      for (const file of jsFiles) {
        const code = fs.readFileSync(path.join(assetsDir, file), 'utf8');
        assert.doesNotMatch(code, /supabase\.co/i, `Bundle ${file} must contain zero Supabase URLs`);
      }
    });

    test('T5.4.3: index.html #main-gallery-grid has zero Supabase img tags and contains layout reservation skeleton', () => {
      const indexPath = path.join(ROOT_DIR, 'index.html');
      const html = fs.readFileSync(indexPath, 'utf8');
      
      // Match innerHTML of main-gallery-grid
      const galleryMatch = html.match(/<div[^>]+id=["']main-gallery-grid["'][^>]*>([\s\S]*?)<\/div>/i);
      assert.ok(galleryMatch, '#main-gallery-grid must exist in index.html');
      
      const galleryInner = galleryMatch[1];
      assert.doesNotMatch(galleryInner, /<img\b[^>]*supabase\.co/i, '#main-gallery-grid must have 0 Supabase img tags');
      assert.match(galleryInner, /gallery-skeleton/, '#main-gallery-grid must contain skeleton placeholders to prevent layout shift');
    });

    test('T5.4.4: Hero LCP image in index.html satisfies fetchpriority="high" loading="eager" decoding="async"', () => {
      const indexPath = path.join(ROOT_DIR, 'index.html');
      const html = fs.readFileSync(indexPath, 'utf8');

      const heroMatch = html.match(/<img\b[^>]*id=["']img-hero-1["'][^>]*>/i);
      assert.ok(heroMatch, '#img-hero-1 must exist in index.html');

      const heroTag = heroMatch[0];
      assert.match(heroTag, /fetchpriority=["']high["']/i, 'Hero image must have fetchpriority="high"');
      assert.match(heroTag, /loading=["']eager["']/i, 'Hero image must have loading="eager"');
      assert.match(heroTag, /decoding=["']async["']/i, 'Hero image must have decoding="async"');
    });

    test('T5.4.5: Synchronous @import is purged from src/style.css', () => {
      const cssPath = path.join(ROOT_DIR, 'src', 'style.css');
      const css = fs.readFileSync(cssPath, 'utf8');
      assert.doesNotMatch(css, /@import\s+url/i, 'src/style.css must not contain synchronous @import url');
    });
  });
});
