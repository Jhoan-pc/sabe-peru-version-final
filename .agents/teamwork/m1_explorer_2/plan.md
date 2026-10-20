# Implementation Blueprint: Scroll Optimization, Visibility Lifecycle & Supabase Purge

**Agent:** `m1_explorer_2`  
**Milestone:** Milestone 1 (Fase 1: Rendimiento Web y Saneamiento de Assets)  
**Target Files:**
- `src/main.ts`
- `src/supabase.ts` (purge/removal)
- `src/experiencia.ts` (sanitization of Supabase references)
- `package.json` / build pipeline verification

---

## 1. Executive Summary & Objectives

This document provides the exact implementation blueprint for resolving **[DT-04]**, **[DT-06]**, and **[DT-09]** in `src/main.ts` and `src/`, conforming strictly to `specs/SDD_MASTER.md` and `specs/performance-spec.md`.

### Core Technical Goals
1. **Erradicate Forced Synchronous Layouts & Scroll Overhead [DT-09]:**
   - Eliminate all three unthrottled, non-passive `window.addEventListener('scroll')` handlers in `src/main.ts`.
   - Implement a passive `IntersectionObserver` with `{ rootMargin: '0px 0px -80px 0px', threshold: 0.1 }` for `.reveal` elements that executes `obs.unobserve(entry.target)` as soon as an element becomes active.
   - Refactor Section Navigation (Scroll Spy) from continuous `section.offsetTop` calculations into an `IntersectionObserver` observing `<section>` elements.
   - Consolidate continuous header scroll tracking into a single passive listener (`{ passive: true }`) throttled via `requestAnimationFrame` (`ticking` flag pattern).
2. **Lifecycle & Visibility Change Management [DT-04 / performance-spec §3.B]:**
   - Prevent background CPU/battery drain by pausing carousel timers (Hero slideshow 5s, Gallery auto-scroll 4s) when `document.visibilityState === 'hidden'`.
   - Pause timers when elements leave the viewport using `IntersectionObserver`.
   - Prevent timer duplication and race conditions upon tab re-entry.
3. **Purge Supabase References in Production Code [DT-06]:**
   - Isolate or delete `src/supabase.ts` (currently importing `@supabase/supabase-js`).
   - Remove/replace residual Supabase comments and console warnings in `src/main.ts` and `src/experiencia.ts`.
   - Guarantee zero references to `@supabase/supabase-js` in the production bundle output.

---

## 2. Baseline Audit of Existing Code

### 2.1. Scroll Listeners in `src/main.ts`

| Line Range | Listener / Functionality | Current Implementation Issue | Performance Penalty |
|---|---|---|---|
| `108–114` | Sticky Header | `window.addEventListener('scroll', () => { if (window.scrollY > 50) ... })` | Non-passive, unthrottled, fires on every scroll tick. |
| `157–176` | Reveal on Scroll (`revealOnScroll`) | `revealElements.forEach(r => { const top = r.getBoundingClientRect().top; ... })` called inside scroll listener | Forced Synchronous Layout (reads layout geometry on every frame for all elements). Never unobserves. |
| `183–199` | Section Spy (Menu Tabs) | `sections.forEach(s => { const top = s.offsetTop; if (window.pageYOffset >= top - 150) ... })` inside scroll listener | Repeated layout reflow (reads `offsetTop` for every section on every frame). |

### 2.2. Interval Timers in `src/main.ts`

| Line Range | Timer Functionality | Current Implementation Issue |
|---|---|---|
| `97–105` | Hero Slideshow | `setInterval(..., 5000)` has no handle variable, cannot be paused, runs indefinitely in background tabs. |
| `535–568` | Gallery Auto-scroll | `autoScrollInterval = setInterval(..., 4000)` pauses on hover/touch, but lacks `visibilitychange` or viewport intersection awareness. |

### 2.3. Supabase Artifacts in `src/`

| File | Lines | Reference Details |
|---|---|---|
| `src/supabase.ts` | `1–10` | Full module importing `@supabase/supabase-js` and creating Supabase client. (Not imported by any file in `src/`). |
| `src/main.ts` | `7, 90` | Line 7: `// Supabase removed, using Firebase...`<br>Line 90: `console.warn('Usando contenido estático (Supabase offline o vacío)');` |
| `src/experiencia.ts` | `5, 16, 43` | Line 5: `// Supabase removido`<br>Line 16: `// It pulls text from Supabase...`<br>Line 43: `console.warn('Usando contenido estático por defecto (Supabase offline o vacío)');` |

---

## 3. Detailed Architectural Blueprint

### Component 1: `IntersectionObserver` for Element Reveal (`.reveal`)
Per `specs/performance-spec.md` §3.A:
- Root margin: `0px 0px -80px 0px`
- Threshold: `0.1`
- Action on intersection: `entry.target.classList.add('active')`
- De-registration: `obs.unobserve(entry.target)` to immediately release memory and compositor resources.

```typescript
// --- SCROLL REVEAL OBSERVER ---
const revealObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
      obs.unobserve(entry.target); // Unobserve once animated
    }
  });
}, {
  rootMargin: '0px 0px -80px 0px',
  threshold: 0.1
});

// Observe all initial un-activated reveal elements
document.querySelectorAll('.reveal:not(.active)').forEach(el => {
  revealObserver.observe(el);
});
```

### Component 2: `IntersectionObserver` for Section Spy (Navigation Tabs)
Instead of polling `section.offsetTop` on scroll, an observer monitors sections entering the reading viewport:
- Root margin: `-20% 0px -70% 0px` (activates when the section enters the top 20%–30% of screen).
- Threshold: `0`

```typescript
// --- SECTION SPY (NAVIGATION OBSERVER) ---
const sections = document.querySelectorAll('section[id]');
const tabs = document.querySelectorAll('.tab-link');

if (tabs.length > 0 && sections.length > 0) {
  const updateActiveTab = (currentId: string) => {
    tabs.forEach(tab => {
      const href = tab.getAttribute('href');
      if (href === `#${currentId}` || href === `/#${currentId}`) {
        tab.classList.add('active');
      } else if (href && (href.startsWith('#') || href.startsWith('/#'))) {
        tab.classList.remove('active');
      }
    });
  };

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        if (id) updateActiveTab(id);
      }
    });
  }, {
    rootMargin: '-20% 0px -70% 0px',
    threshold: 0
  });

  sections.forEach(section => sectionObserver.observe(section));
}
```

### Component 3: Single Passive rAF-Throttled Scroll Listener for Sticky Header
Per `specs/performance-spec.md` §3.A:
- Passive listener: `{ passive: true }`
- Throttled with `requestAnimationFrame` and a boolean `isTicking` flag.
- Single responsibility: Header `.scrolled` state toggle.

```typescript
// --- STICKY HEADER (THROTTLED PASSIVE SCROLL) ---
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
onScrollThrottled(); // Initialize on load
```

### Component 4: Unified Lifecycle & Visibility Controller
Per `specs/performance-spec.md` §3.B:
- Manages both Hero Slideshow and Gallery Auto-scroll.
- Pauses on `document.visibilityState === 'hidden'`.
- Pauses when the section is not visible in the viewport (`IntersectionObserver`).
- Automatically resumes when the tab is visible AND the section is in viewport.

```typescript
// ==========================================
// LIFECYCLE & VISIBILITY CONTROLLER
// ==========================================

// 1. Hero Slideshow Control
let heroInterval: ReturnType<typeof setInterval> | null = null;
let isHeroInView = true;
const heroSlides = document.querySelectorAll('.hero-slide');
let currentSlide = 0;

const startHeroSlideshow = () => {
  if (heroInterval || heroSlides.length <= 1) return;
  if (document.visibilityState === 'hidden' || !isHeroInView) return;
  heroInterval = setInterval(() => {
    heroSlides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % heroSlides.length;
    heroSlides[currentSlide].classList.add('active');
  }, 5000);
};

const stopHeroSlideshow = () => {
  if (heroInterval) {
    clearInterval(heroInterval);
    heroInterval = null;
  }
};

// 2. Gallery Auto-scroll Control
let autoScrollInterval: ReturnType<typeof setInterval> | null = null;
let isGalleryInView = false;

const startAutoScroll = () => {
  stopAutoScroll();
  if (document.visibilityState === 'hidden' || !isGalleryInView || isDown) return;
  autoScrollInterval = setInterval(() => {
    if (!isDown && galleryGrid) {
      const scrollAmount = window.innerWidth > 768 ? window.innerWidth * 0.3 : window.innerWidth * 0.8;
      if (galleryGrid.scrollLeft + galleryGrid.clientWidth >= galleryGrid.scrollWidth - 10) {
        galleryGrid.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        galleryGrid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  }, 4000);
};

const stopAutoScroll = () => {
  if (autoScrollInterval) {
    clearInterval(autoScrollInterval);
    autoScrollInterval = null;
  }
};

// 3. Viewport Observers for Timers
const heroSection = document.querySelector('.hero-premium') || document.querySelector('.hero-slides');
if (heroSection) {
  const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isHeroInView = entry.isIntersecting;
      if (entry.isIntersecting) {
        startHeroSlideshow();
      } else {
        stopHeroSlideshow();
      }
    });
  }, { threshold: 0.1 });
  heroObserver.observe(heroSection);
}

if (galleryGrid) {
  const galleryObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isGalleryInView = entry.isIntersecting;
      if (entry.isIntersecting) {
        startAutoScroll();
      } else {
        stopAutoScroll();
      }
    });
  }, { threshold: 0.1 });
  galleryObserver.observe(galleryGrid);
}

// 4. Tab Visibility Listener
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

### Component 5: Supabase Purge Execution Plan
1. **Remove `src/supabase.ts`:**
   Delete `src/supabase.ts` completely (or move to `legacy/supabase.ts`). Zero files in `src/` import it.
2. **Sanitize `src/main.ts` Line 90:**
   Change:
   ```typescript
   console.warn('Usando contenido estático (Supabase offline o vacío)');
   ```
   To:
   ```typescript
   console.warn('Usando contenido estático (Firestore offline o vacío)');
   ```
3. **Sanitize `src/experiencia.ts` Lines 5, 16, 43:**
   Remove Supabase comments and change console warning from Supabase to Firestore.
4. **Validate Package & Build:**
   Confirm that `tsc --noEmit && vite build` succeeds with Exit Code 0 and `@supabase/supabase-js` is completely absent from all emitted bundles.

---

## 4. Precise Code Modifications in `src/main.ts`

### Chunk 1: Header Scroll & Hero Slideshow Replacement
**Target Lines:** `96–114`

#### Original Code:
```typescript
  // --- HERO SLIDESHOW ---
  const heroSlides = document.querySelectorAll('.hero-slide');
  if (heroSlides.length > 0) {
    let currentSlide = 0;
    setInterval(() => {
      heroSlides[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % heroSlides.length;
      heroSlides[currentSlide].classList.add('active');
    }, 5000); // Change every 5 seconds
  }

  // Sticky Header
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  });
```

#### Replacement Code:
```typescript
  // --- HERO SLIDESHOW WITH LIFECYCLE MANAGEMENT ---
  const heroSlides = document.querySelectorAll('.hero-slide');
  let heroInterval: ReturnType<typeof setInterval> | null = null;
  let currentSlide = 0;
  let isHeroInView = true;

  const startHeroSlideshow = () => {
    if (heroInterval || heroSlides.length <= 1) return;
    if (document.visibilityState === 'hidden' || !isHeroInView) return;
    heroInterval = setInterval(() => {
      heroSlides[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % heroSlides.length;
      heroSlides[currentSlide].classList.add('active');
    }, 5000);
  };

  const stopHeroSlideshow = () => {
    if (heroInterval) {
      clearInterval(heroInterval);
      heroInterval = null;
    }
  };

  startHeroSlideshow();

  const heroSection = document.querySelector('.hero-premium') || document.querySelector('.hero-slides');
  if (heroSection) {
    const heroObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isHeroInView = entry.isIntersecting;
        if (entry.isIntersecting) {
          startHeroSlideshow();
        } else {
          stopHeroSlideshow();
        }
      });
    }, { threshold: 0.1 });
    heroObserver.observe(heroSection);
  }

  // --- STICKY HEADER (PASSIVE rAF-THROTTLED) ---
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
  onScrollThrottled();
```

---

### Chunk 2: Scroll Reveal & Menu Tabs Replacement
**Target Lines:** `156–199`

#### Original Code:
```typescript
  // --- SCROLL REVEAL ANIMATION ---
  const revealElements = document.querySelectorAll('.reveal');

  const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    const elementVisible = 150;

    revealElements.forEach((reveal) => {
      const elementTop = reveal.getBoundingClientRect().top;
      if (elementTop < windowHeight - elementVisible) {
        reveal.classList.add('active');
      } else {
        // Optional: remove active to re-animate
        // reveal.classList.remove('active');
      }
    });
  };

  window.addEventListener('scroll', revealOnScroll);
  revealOnScroll(); // Trigger once on load

  // --- MENU TABS (Scroll Spy) ---
  const sections = document.querySelectorAll('section');
  const tabs = document.querySelectorAll('.tab-link');
  const menuGrid = document.querySelector('.menu-grid');

  if (tabs.length > 0) {
    window.addEventListener("scroll", () => {
      let current = "";
      sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        if (window.pageYOffset >= sectionTop - 150) {
          current = section.getAttribute("id") || "";
        }
      });

      tabs.forEach((tab) => {
        tab.classList.remove("active");
        if (tab.getAttribute("href") === `#${current}`) {
          tab.classList.add("active");
        }
      });
    });
  }
```

#### Replacement Code:
```typescript
  // --- SCROLL REVEAL ANIMATION (INTERSECTION OBSERVER) ---
  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        obs.unobserve(entry.target); // Stop observing once visible
      }
    });
  }, {
    rootMargin: '0px 0px -80px 0px',
    threshold: 0.1
  });

  document.querySelectorAll('.reveal:not(.active)').forEach(el => {
    revealObserver.observe(el);
  });

  // --- MENU TABS (SCROLL SPY VIA INTERSECTION OBSERVER) ---
  const sections = document.querySelectorAll('section[id]');
  const tabs = document.querySelectorAll('.tab-link');
  const menuGrid = document.querySelector('.menu-grid');

  if (tabs.length > 0 && sections.length > 0) {
    const updateActiveTab = (currentId: string) => {
      tabs.forEach((tab) => {
        const href = tab.getAttribute('href');
        if (href === `#${currentId}` || href === `/#${currentId}`) {
          tab.classList.add('active');
        } else if (href && (href.startsWith('#') || href.startsWith('/#'))) {
          tab.classList.remove('active');
        }
      });
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          if (id) updateActiveTab(id);
        }
      });
    }, {
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    });

    sections.forEach(section => sectionObserver.observe(section));
  }
```

---

### Chunk 3: Gallery Auto-scroll & Visibility Listener Replacement
**Target Lines:** `535–569`

#### Original Code:
```typescript
    // Auto-advance functionality
    let autoScrollInterval: ReturnType<typeof setInterval>;

    const startAutoScroll = () => {
      stopAutoScroll(); // ensure no duplicates
      autoScrollInterval = setInterval(() => {
        if (!isDown) {
          const scrollAmount = window.innerWidth > 768 ? window.innerWidth * 0.3 : window.innerWidth * 0.8;
          // Determine if we are at the end
          if ((galleryGrid as HTMLElement).scrollLeft + (galleryGrid as HTMLElement).clientWidth >= (galleryGrid as HTMLElement).scrollWidth - 10) {
            // Scroll back to start
            galleryGrid.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            // Scroll right
            galleryGrid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
          }
        }
      }, 4000); // 4 seconds interval
    };

    const stopAutoScroll = () => {
      if (autoScrollInterval) clearInterval(autoScrollInterval);
    };

    // Pause auto-scroll on hover or interaction
    galleryGrid.addEventListener('mouseenter', stopAutoScroll);
    galleryGrid.addEventListener('mouseleave', () => {
      if (!isDown) startAutoScroll();
    });
    galleryGrid.addEventListener('touchstart', stopAutoScroll, { passive: true });
    galleryGrid.addEventListener('touchend', startAutoScroll, { passive: true });

    startAutoScroll(); // init
```

#### Replacement Code:
```typescript
    // Auto-advance functionality with lifecycle management
    let autoScrollInterval: ReturnType<typeof setInterval> | null = null;
    let isGalleryInView = false;

    const startAutoScroll = () => {
      stopAutoScroll();
      if (document.visibilityState === 'hidden' || !isGalleryInView || isDown) return;
      autoScrollInterval = setInterval(() => {
        if (!isDown && galleryGrid) {
          const scrollAmount = window.innerWidth > 768 ? window.innerWidth * 0.3 : window.innerWidth * 0.8;
          if (galleryGrid.scrollLeft + galleryGrid.clientWidth >= galleryGrid.scrollWidth - 10) {
            galleryGrid.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            galleryGrid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
          }
        }
      }, 4000);
    };

    const stopAutoScroll = () => {
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
      }
    };

    // Viewport Intersection Observer for Gallery
    const galleryObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isGalleryInView = entry.isIntersecting;
        if (entry.isIntersecting) {
          startAutoScroll();
        } else {
          stopAutoScroll();
        }
      });
    }, { threshold: 0.1 });
    galleryObserver.observe(galleryGrid);

    // Pause auto-scroll on hover or interaction
    galleryGrid.addEventListener('mouseenter', stopAutoScroll);
    galleryGrid.addEventListener('mouseleave', () => {
      if (!isDown && isGalleryInView) startAutoScroll();
    });
    galleryGrid.addEventListener('touchstart', stopAutoScroll, { passive: true });
    galleryGrid.addEventListener('touchend', () => {
      if (isGalleryInView) startAutoScroll();
    }, { passive: true });

    startAutoScroll();
```

And immediately before closing `DOMContentLoaded` (around line 647):
```typescript
  // --- GLOBAL VISIBILITY CHANGE CONTROLLER ---
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

---

## 5. Supabase Purge Details & Verification

### Actions to Perform
1. **Delete File:** `src/supabase.ts` (contains `@supabase/supabase-js`).
2. **Sanitize Warning in `src/main.ts` Line 90:**
   ```typescript
   console.warn('Usando contenido estático (Firestore offline o vacío)');
   ```
3. **Sanitize Warning & Comments in `src/experiencia.ts`:**
   Line 16 comment updated to Firestore. Line 43 warning updated to `'(Firestore offline o vacío)'`.

### Invariant Checks
- Zero runtime imports of `@supabase/supabase-js` anywhere in `src/`.
- `tsc --noEmit` compiles with Exit Code 0.
- `vite build` produces bundles with no Supabase chunks.

---

## 6. Verification and Validation Protocol

1. **Compilation Gate:**
   ```bash
   npm run pipeline
   ```
   Must pass with Exit Code 0 and 0 TypeScript errors.

2. **Scroll Listener Verification:**
   - Execute grep in `src/main.ts` for `addEventListener('scroll'`.
   - Result: Exactly 1 instance, configured with `{ passive: true }` and `requestAnimationFrame`.
   - Zero instances of `getBoundingClientRect()` or `offsetTop` inside any scroll callback.

3. **Timer & Visibility Verification:**
   - Open DevTools Performance / Console in Chrome/Edge.
   - Verify slideshow and auto-scroll intervals stop firing when switching browser tabs (`document.visibilityState === 'hidden'`).
   - Verify intervals resume smoothly upon switching back.

4. **Supabase Zero-Reference Verification:**
   - Execute grep for `@supabase` across `src/`.
   - Result: 0 matches.
