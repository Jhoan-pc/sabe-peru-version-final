import { db } from './firebase';
import { collection, query, where, getDocs, addDoc, orderBy } from 'firebase/firestore';
import {
  initReservationUI,
  validateGuestCount,
  checkSlotAvailabilityAtSubmit,
  generateReservationLocator,
  buildWhatsAppReservationUrl,
  renderConfirmationCardHtml,
  showProblemToast,
  type ReservationDoc
} from './reservations';

export function normalizeCloudinaryUrl(url: string | null | undefined, width = 800): string {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
    return url || '';
  }
  const cleanUrl = url.split('?')[0];
  const uploadIndex = cleanUrl.indexOf('/upload/');
  if (uploadIndex === -1) return cleanUrl;
  const base = cleanUrl.substring(0, uploadIndex + 8);
  let rest = cleanUrl.substring(uploadIndex + 8);
  const parts = rest.split('/');
  if (parts.length > 1 && parts[0].includes('_')) {
    parts.shift();
    rest = parts.join('/');
  }
  return `${base}f_auto,q_auto,w_${width},c_limit/${rest}`;
}

// Using Firebase from './firebase.ts'

// ============================================================================
// CANONICAL CARTA CONTRACTS & INTERFACES (SSOT: specs/openapi.yaml)
// ============================================================================

export const OFFICIAL_ALLERGEN_TAGS = [
  'pescado',
  'marisco',
  'carne',
  'pollo',
  'picante',
  'gluten-free',
  'gluten',
  'huevos',
  'lacteos',
  'soja',
  'cacahuetes',
  'mostaza',
  'crustaceos',
  'apio',
  'moluscos',
  'sesamo'
] as const;

export type AllergenTag = typeof OFFICIAL_ALLERGEN_TAGS[number];

export type MenuCategory = 'comida' | 'coctel' | 'bebida';

export interface MenuItem {
  id?: string;
  name: string;
  description?: string;
  price: number;
  category: MenuCategory | string;
  subcategory?: string;
  sort_order?: number;
  tags?: AllergenTag[];
  is_available?: boolean;
  image_url?: string | null;
}

export interface FormattedPrice {
  isMarketPrice: boolean;
  priceClass: string;
  displayPrice: string;
}

// ============================================================================
// PURE DOMAIN FUNCTIONS (CARTA & ALLERGENS)
// ============================================================================

export function sanitizeDishName(name: string): string {
  if (!name) return '';
  return name
    .replace(/\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]|[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isValidAllergenTag(tag: unknown): tag is AllergenTag {
  return typeof tag === 'string' && (OFFICIAL_ALLERGEN_TAGS as readonly string[]).includes(tag);
}

export function renderAllergenPill(tag: string): string {
  if (!isValidAllergenTag(tag)) return '';
  const label = (tag === 'gluten-free' ? 'GLUTEN-FREE' : tag).toUpperCase();
  return `<span class="allergen-pill" data-allergen="${tag}">${label}</span>`;
}

export function formatMenuItemPrice(price: number | string, description: string = ''): FormattedPrice {
  const numericPrice = typeof price === 'number' ? price : parseFloat(String(price));

  if (isNaN(numericPrice) || numericPrice <= 0) {
    return {
      isMarketPrice: true,
      priceClass: 'menu-item-price dual',
      displayPrice: (description && description.trim().length > 0)
        ? description.trim()
        : 'Precio según mercado'
    };
  }

  return {
    isMarketPrice: false,
    priceClass: 'menu-item-price',
    displayPrice: `${numericPrice.toFixed(2)}€`
  };
}

export function renderMenuItemHtml(item: MenuItem): string {
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
        <span><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px; margin-right:4px;"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>FOTOGRAFÍA</span>
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

document.addEventListener('DOMContentLoaded', () => {
  // --- RESERVATION UI INITIALIZATION ---
  initReservationUI('reservation-form', 'time-slots-container');

  // --- NAVIGATION ---
  const header = document.getElementById('main-header');
  const navLinks = document.querySelector('.nav-links');
  const reservationForm = document.getElementById('reservation-form');
  let siteCache: Record<string, string> = {};

  // --- LIFECYCLE & VISIBILITY HANDLES (TOP-LEVEL SCOPE TO PREVENT TS2304) ---
  let startHeroSlideshow = () => {};
  let stopHeroSlideshow = () => {};
  let isHeroInView = true;

  let startAutoScroll = () => {};
  let stopAutoScroll = () => {};
  let isGalleryInView = false;

  // --- DYNAMIC CONTENT ---
  async function initDynamicContent() {
    try {
      const q = query(collection(db, 'site_content'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => doc.data());

      data?.forEach(item => {
        try {
          siteCache[item.key] = item.content;
          const el = document.getElementById(item.key.replace(/_/g, '-'));
          if (el) {
            if (item.type === 'html') {
              el.innerHTML = item.content || '';
            } else if (item.type === 'image') {
              (el as HTMLImageElement).src = item.content || '';
            } else if (el.tagName === 'IFRAME') {
               // Exclude map_url if we want to force the local hardcoded one
               if (item.key !== 'map_url') {
                   (el as HTMLIFrameElement).src = item.content || '';
               }
            } else {
              if (item.key === 'contact_fb') {
                 const val = (item.content || '').trim();
                 const url = val.startsWith('http') ? val : `https://${val}`;
                 (el as HTMLAnchorElement).href = url;
                 (el as HTMLAnchorElement).textContent = "Facebook";
              } else if (item.key === 'contact_tiktok') {
                 const val = (item.content || '').trim();
                 const url = val.startsWith('http') ? val : `https://${val}`;
                 (el as HTMLAnchorElement).href = url;
                 (el as HTMLAnchorElement).textContent = "TikTok";
              } else if (item.key === 'contact_insta') {
                 const val = (item.content || '').trim();
                 const url = val.startsWith('http') ? val : `https://${val}`;
                 (el as HTMLAnchorElement).href = url;
                 (el as HTMLAnchorElement).textContent = "Instagram";
              } else {
                 if (item.content && item.content.trim() !== '') {
                     if (item.key === 'contact_whatsapp') {
                         el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/></svg> T. ${item.content}`;
                     } else if (item.key.startsWith('hours_')) {
                         el.textContent = item.content;
                     } else {
                         el.textContent = item.content;
                     }
                 }
              }
              if (el.tagName === 'A') {
                if (item.key === 'contact_phone') {
                  const cleanPhone = (item.content || '').replace(/\D/g, '');
                  (el as HTMLAnchorElement).href = `tel:+${cleanPhone}`;
                } else if (item.key === 'contact_whatsapp') {
                  const cleanPhone = (item.content || '').replace(/\D/g, '');
                  (el as HTMLAnchorElement).href = `https://wa.me/${cleanPhone}`;
                }
              }
            }
          } else {
            if (item.key === 'font_title') {
                const allowedSerifs = ["'Cormorant Garamond', serif", "'Playfair Display', serif"];
                const safeSerif = allowedSerifs.includes(item.content)
                  ? item.content
                  : "'Cormorant Garamond', 'Playfair Display', serif";
                document.documentElement.style.setProperty('--font-serif', safeSerif);
            } else if (item.key === 'font_text') {
                const allowedSans = ["'Inter', sans-serif", "'Montserrat', sans-serif"];
                const safeSans = allowedSans.includes(item.content)
                  ? item.content
                  : "'Inter', sans-serif";
                document.documentElement.style.setProperty('--font-sans', safeSans);
            }
          }
        } catch (innerErr) {
          console.error("Error processing dynamic element:", item.key, innerErr);
        }
      });
    } catch (err) {
      console.warn('Usando contenido estático por defecto (offline o vacío)');
    }
  }

  initDynamicContent();

  // --- HERO SLIDESHOW & LIFECYCLE ---
  const heroSlides = document.querySelectorAll('.hero-slide');
  const heroSection = document.getElementById('inicio');
  let heroInterval: ReturnType<typeof setInterval> | null = null;
  let currentSlide = 0;

  startHeroSlideshow = () => {
    if (heroInterval || heroSlides.length <= 1) return;
    if (document.visibilityState === 'hidden' || !isHeroInView) return;
    heroInterval = setInterval(() => {
      heroSlides[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % heroSlides.length;
      heroSlides[currentSlide].classList.add('active');
    }, 5000);
  };

  stopHeroSlideshow = () => {
    if (heroInterval) {
      clearInterval(heroInterval);
      heroInterval = null;
    }
  };

  if (heroSlides.length > 1) {
    if (heroSection && 'IntersectionObserver' in window) {
      const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isHeroInView = entry.isIntersecting;
          if (isHeroInView) {
            startHeroSlideshow();
          } else {
            stopHeroSlideshow();
          }
        });
      }, { threshold: 0.1 });
      heroObserver.observe(heroSection);
    } else {
      startHeroSlideshow();
    }
  }

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
  onScrollThrottled();

  // Mobile Menu Logic
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');
  const mobileLinks = mobileNav?.querySelectorAll('a');

  if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenuBtn.classList.toggle('active');
      mobileNav.classList.toggle('active');
      document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
    });

    mobileLinks?.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenuBtn.classList.remove('active');
        mobileNav.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // Smooth Scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      navLinks?.classList.remove('active'); // Close mobile menu

      const targetId = (e.currentTarget as HTMLAnchorElement).getAttribute('href')?.substring(1);
      if (!targetId) return;

      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: 'smooth'
        });
      }
    });
  });

  // --- SCROLL REVEAL ANIMATION (PASSIVE INTERSECTION OBSERVER) ---
  const revealElements = document.querySelectorAll('.reveal:not(.active)');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          obs.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -80px 0px',
      threshold: 0.1
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('active'));
  }

  // --- MENU TABS (Scroll Spy using IntersectionObserver) ---
  const sections = document.querySelectorAll('section[id]');
  const tabs = document.querySelectorAll('.tab-link');
  const menuGrid = document.querySelector('.menu-grid') as HTMLElement | null;

  if (tabs.length > 0 && sections.length > 0 && 'IntersectionObserver' in window) {
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

  // --- MENU LOGIC (Only if menu grid exists) ---
  if (menuGrid) {
    const filterBtns = document.querySelectorAll('.filter-btn');

    // --- PHOTO MODAL LOGIC (Initialized once in outer scope to prevent listener accumulation) ---
    const photoModal = document.getElementById('menu-photo-modal');
    const modalImg = photoModal?.querySelector('.menu-modal-img') as HTMLImageElement | null;
    const modalName = photoModal?.querySelector('.modal-item-name');
    const modalDesc = photoModal?.querySelector('.modal-item-desc');
    const closeModalBtn = photoModal?.querySelector('.close-menu-modal');

    const closePhotoModal = () => {
      photoModal?.classList.remove('active');
      if (modalImg) modalImg.src = '';
      document.body.style.overflow = '';
    };

    if (photoModal) {
      closeModalBtn?.addEventListener('click', closePhotoModal);
      photoModal.addEventListener('click', (e) => {
        if (e.target === photoModal) closePhotoModal();
      });
      document.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Escape' && photoModal.classList.contains('active')) {
          closePhotoModal();
        }
      });
    }

    let currentCategory = 'comida';
    let currentTag: string | null = null;
    let currentProtein = 'all';

    function matchesProtein(item: MenuItem, filter: string): boolean {
      if (!filter || filter === 'all') return true;
      if ((item.subcategory || '').toUpperCase() === 'POSTRES') return false;
      const text = `${item.name || ''} ${item.description || ''} ${(Array.isArray(item.tags) ? item.tags : []).join(' ')}`.toLowerCase();
      if (filter === 'pollo') {
        return /\b(pollo|ave|gallina|pato|alitas|mostrito)\b/i.test(text);
      }
      if (filter === 'carne') {
        return /\b(carne|lomo|res|vacuno|cerdo|panceta|ternera|anticucho|anticuchos|hamburguesa|solomillo|chicharr[oó]n de cerdo)\b/i.test(text);
      }
      if (filter === 'mariscos') {
        return /\b(marisco|mariscos|pescado|ceviche|tiradito|corvina|pulpo|langostino|langostinos|camar[oó]n|camarones|calamar|calamares|choritos|jalea|tataki)\b/i.test(text);
      }
      return true;
    }

    async function loadMenu(category: string, tagFilter: string | null = null, proteinFilter: string = 'all') {
      const proteinFiltersContainer = document.getElementById('protein-filters');
      if (proteinFiltersContainer) {
        proteinFiltersContainer.style.display = category === 'comida' ? 'flex' : 'none';
      }

      if (menuGrid!.children.length > 0) {
        menuGrid!.style.opacity = '0.35';
        menuGrid!.style.transition = 'opacity 0.2s ease';
      } else {
        menuGrid!.innerHTML = '<div class="loading-state">Preparando los sabores de hoy...</div>';
      }

      try {
        const q = query(
          collection(db, 'menu_items'),
          where('is_available', '==', true),
          where('category', '==', category)
        );
        
        const qs = await getDocs(q);
        let data: MenuItem[] = qs.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<MenuItem, 'id'>)
        }));

        if (tagFilter) {
          data = data.filter((d: MenuItem) => (Array.isArray(d.tags) ? d.tags : []).includes(tagFilter as AllergenTag));
        }

        if (proteinFilter && proteinFilter !== 'all') {
          data = data.filter((d: MenuItem) => matchesProtein(d, proteinFilter));
        }
        
        data.sort((a: MenuItem, b: MenuItem) => (a.sort_order || 0) - (b.sort_order || 0));

        if (!data || data.length === 0) {
          const msg = tagFilter
            ? `No encontramos platos con la etiqueta "${tagFilter}" en este momento.`
            : (proteinFilter !== 'all' ? `No hay platos en la sección seleccionada.` : `Próximamente novedades en ${category}s.`);
          menuGrid!.innerHTML = `<div class="loading-state">${msg}</div>`;
          menuGrid!.style.opacity = '1';
          return;
        }

        // Group by subcategory with sanitization
        const groups: Record<string, MenuItem[]> = {};
        data.forEach((item: MenuItem) => {
          const sub = sanitizeDishName(item.subcategory || 'OTROS');
          if (!groups[sub]) groups[sub] = [];
          groups[sub].push(item);
        });

        let html = '';
        if (tagFilter) {
          html += `<div class="filter-notice">Filtrando por: <strong>${tagFilter.toUpperCase()}</strong> <a href="#" onclick="window.location.search=''; return false;" style="color:var(--lux-gold-champagne, #c5a880); margin-left:10px; font-size:0.8em;">(Ver Todo)</a></div>`;
        }

        for (const sub in groups) {
          html += `<div class="menu-subcategory-title">${sub}</div>`;
          html += groups[sub].map(renderMenuItemHtml).join('');
        }
        menuGrid!.innerHTML = html;
        menuGrid!.style.opacity = '1';
        menuGrid!.style.transition = 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)';

        // --- PHOTO TRIGGER BINDING FOR LOADED MENU ITEMS ---
        const photoBtns = menuGrid!.querySelectorAll('.dish-photo-trigger, .item-photo-btn');

        photoBtns.forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const target = e.currentTarget as HTMLElement;
            const imgUrl = target.getAttribute('data-img');
            const name = target.getAttribute('data-name');
            const desc = target.getAttribute('data-desc');

            if (photoModal && modalImg && imgUrl) {
              let finalUrl = imgUrl;
              if (finalUrl.includes('cloudinary')) {
                if (finalUrl.includes('f_auto,q_auto') && !finalUrl.includes('w_')) {
                  finalUrl = finalUrl.replace('f_auto,q_auto', 'f_auto,q_auto,w_800,c_limit');
                } else if (!finalUrl.includes('f_auto')) {
                  finalUrl = finalUrl.replace('/upload/', '/upload/f_auto,q_auto,w_800,c_limit/');
                }
              }
              modalImg.src = finalUrl;
              if (modalName) modalName.textContent = name || '';
              if (modalDesc) modalDesc.textContent = desc || '';
              photoModal.classList.add('active');
              document.body.style.overflow = 'hidden'; // Lock scroll
            }
          });
        });

      } catch (err) {
        console.error('Error loading menu:', err);
        menuGrid!.innerHTML = '<div class="loading-state">Estamos ordenando los sabores. Por favor, refresca en un momento.</div>';
      }
    }

    const proteinBtns = document.querySelectorAll('.protein-btn');
    proteinBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        proteinBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentProtein = btn.getAttribute('data-protein') || 'all';
        loadMenu(currentCategory, currentTag, currentProtein);
      });
    });

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.getAttribute('data-category') || 'comida';
        currentCategory = cat;
        currentTag = null;
        currentProtein = 'all';
        proteinBtns.forEach(b => {
          if (b.getAttribute('data-protein') === 'all') b.classList.add('active');
          else b.classList.remove('active');
        });
        loadMenu(currentCategory, null, currentProtein);
      });
    });

    // Check URL params for initial category
    const urlParams = new URLSearchParams(window.location.search);
    const initialCat = urlParams.get('cat') || 'comida';
    const initialTag = urlParams.get('tag'); // Get tag from URL
    currentCategory = initialCat;
    currentTag = initialTag;

    // Set active button (only if no tag, or default to cat)
    filterBtns.forEach(btn => {
      if (btn.getAttribute('data-category') === initialCat) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Initial load
    loadMenu(initialCat, initialTag, currentProtein);
  }

  // --- GALLERY LOGIC (Grid Layout & Firestore gallery_items SSOT) ---
  const galleryGrid = document.querySelector('.gallery-grid');

  interface PublicGalleryItem {
    id?: string;
    image_url?: string;
    secure_url?: string;
    public_id?: string;
    created_at?: string;
    title?: string;
    caption_title?: string;
    description?: string;
    caption_desc?: string;
    name?: string;
    localUrl?: string;
  }

  if (galleryGrid) {
    async function loadGallery() {
      try {
        let galleryFiles: PublicGalleryItem[] = [];
        try {
          const q = query(collection(db, 'gallery_items'), orderBy('created_at', 'desc'));
          const snap = await getDocs(q);
          galleryFiles = snap.docs.map(d => ({ id: d.id, ...(d.data() as PublicGalleryItem) }));
        } catch (e) {
          console.warn('Gallery no encontrada en Firestore aún, usando locales.', e);
        }

        // Si la galería de Firestore está vacía, usamos las locales por defecto
        let isFallback = false;
        if (galleryFiles.length === 0) {
          isFallback = true;
          galleryFiles = [
            { name: 'galeria1', localUrl: '/assets/Hero1.webp' },
            { name: 'galeria2', localUrl: '/assets/hero2.webp' },
            { name: 'galeria3', localUrl: '/assets/hero3.webp' },
            { name: 'galeria4', localUrl: '/assets/hero4.webp' },
            { name: 'galeria6', localUrl: '/assets/Ceviche.webp' },
            { name: 'galeria7', localUrl: '/assets/Cocteles.webp' },
            { name: 'galeria8', localUrl: '/assets/LomoSalteado.webp' },
            { name: 'galeria9', localUrl: '/assets/Mariscos.webp' }
          ];
        }

        if (galleryFiles.length > 0) {
          galleryGrid!.innerHTML = ''; // Clear default

          for (const [index, fileRef] of galleryFiles.entries()) {
            let fileUrl = '';
            let isVideo = false;
            if (isFallback) {
              fileUrl = fileRef.localUrl || '';
              isVideo = false;
            } else {
              const rawUrl = fileRef.image_url || fileRef.secure_url || '';
              fileUrl = normalizeCloudinaryUrl(rawUrl, 600);
              isVideo = fileUrl.endsWith('.mp4');
            }

            // Layout classes based on index (Original premium grid)
            let layoutClass = '';
            if (index === 0) layoutClass = 'tall'; // First item tall
            if (index === 3) layoutClass = 'wide'; // Fourth item wide

            const item = document.createElement('div');
            item.className = `gallery-item ${layoutClass} reveal active`;

            const baseName = (isFallback ? (fileRef.name || '') : (fileRef.public_id || fileRef.title || fileRef.caption_title || '')).split('.')[0].toLowerCase();
            const captions: Record<string, { title: string, desc: string, linkStr?: string }> = {
              'galeria1': { title: 'La Experiencia', desc: 'Decoración milenaria en cada rincón, inspirada en las enigmáticas Líneas de Nazca.', linkStr: '<a href="/#experiencia" class="gallery-overlay-link">Ver Concepto</a>' },
              'galeria3': { title: 'Mixología', desc: 'Nuestros cócteles de autor te sorprenderán. El acompañamiento ideal para la experiencia peruana.', linkStr: '<a href="carta.html?cat=coctel" class="gallery-overlay-link">Ver Cócteles</a>' },
              'galeria4': { title: 'El Fuego', desc: 'Lomo saltado al rojo vivo. Técnicas asiáticas fusionadas con la sazón criolla tradicional.' },
              'galeria5': { title: 'El Dulce Final', desc: 'Delicados postres limeños. El cierre perfecto que no te puedes perder.', linkStr: '<a href="carta.html?cat=comida" class="gallery-overlay-link">Nuestros Postres</a>' },
              'galeria6': { title: 'Puros Mares', desc: 'El ceviche clásico interpretado con la pesca del día más fresca.' },
              'galeria10': { title: 'Artesanía Visual', desc: 'Detalles que evocan la costa y la sierra, preparados para deleitarte.', linkStr: '<a href="carta.html" class="gallery-overlay-link">Descubrir la Carta</a>' }
            };

            const fallbackCaptions = [
              { title: 'Nuestra Esencia', desc: 'Momentos y sabores inolvidables esperándote.' },
              { title: 'Alta Cocina', desc: 'Respeto profundo por el ingrediente y pasión por el emplatado.' },
              { title: 'Sabe a Perú', desc: 'Un viaje culinario que tocará todos tus sentidos.' }
            ];

            const defaultCaption = captions[baseName] || fallbackCaptions[index % fallbackCaptions.length];
            const titleText = fileRef.caption_title || fileRef.title || defaultCaption.title;
            const descText = fileRef.caption_desc || fileRef.description || defaultCaption.desc;
            const linkStr = defaultCaption.linkStr || '';

            const overlayHTML = `
              <div class="gallery-overlay">
                <span class="gallery-overlay-title">${titleText}</span>
                <span class="gallery-overlay-desc">${descText}</span>
                ${linkStr}
              </div>
            `;

            if (isVideo) {
              item.innerHTML = `<video src="${fileUrl}" muted loop playsinline draggable="false" onmouseover="this.play()" onmouseout="this.pause()" style="transform: translateZ(0); will-change: transform;"></video>${overlayHTML}`;
            } else {
              item.innerHTML = `<img src="${fileUrl}" alt="${titleText}" draggable="false" loading="lazy" decoding="async" onload="this.style.opacity=1" style="transform: translateZ(0); will-change: transform; transition: opacity 0.3s, transform 0.6s ease, filter 0.6s ease; opacity: 0;"><div class="skeleton-bg" style="position:absolute; inset:0; background:#111; z-index:-1;"></div>${overlayHTML}`;
            }
            galleryGrid!.appendChild(item);
          }
        }
      } catch (err) {
        console.error('Error loading gallery:', err);
      }
    }
    loadGallery();

    // Gallery Navigation Logic
    const btnPrev = document.getElementById('gallery-prev');
    const btnNext = document.getElementById('gallery-next');

    if (btnPrev && galleryGrid) {
      btnPrev.addEventListener('click', () => {
        const scrollAmount = window.innerWidth > 768 ? window.innerWidth * 0.3 : window.innerWidth * 0.8;
        galleryGrid.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      });
    }

    if (btnNext && galleryGrid) {
      btnNext.addEventListener('click', () => {
        const scrollAmount = window.innerWidth > 768 ? window.innerWidth * 0.3 : window.innerWidth * 0.8;
        galleryGrid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      });
    }

    // Drag to scroll functionality for fluidity
    let isDown = false;
    let startX: number;
    let scrollLeft: number;

    galleryGrid.addEventListener('mousedown', (e) => {
      isDown = true;
      galleryGrid.classList.add('active-drag');
      startX = (e as MouseEvent).pageX - (galleryGrid as HTMLElement).offsetLeft;
      scrollLeft = (galleryGrid as HTMLElement).scrollLeft;
      // Pause CSS snap while dragging
      (galleryGrid as HTMLElement).style.scrollSnapType = 'none';
    });

    const stopDragging = () => {
      isDown = false;
      galleryGrid.classList.remove('active-drag');
      // Restore CSS snap
      (galleryGrid as HTMLElement).style.scrollSnapType = 'x mandatory';
    };

    galleryGrid.addEventListener('mouseleave', stopDragging);
    galleryGrid.addEventListener('mouseup', stopDragging);

    galleryGrid.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = (e as MouseEvent).pageX - (galleryGrid as HTMLElement).offsetLeft;
      const walk = (x - startX) * 2; // Scroll-fast modifier
      (galleryGrid as HTMLElement).scrollLeft = scrollLeft - walk;
    });

    // Auto-advance functionality
    let autoScrollInterval: ReturnType<typeof setInterval> | null = null;

    startAutoScroll = () => {
      stopAutoScroll(); // ensure no duplicates
      if (document.visibilityState === 'hidden' || !isGalleryInView || isDown) return;
      autoScrollInterval = setInterval(() => {
        if (!isDown && galleryGrid) {
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

    stopAutoScroll = () => {
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
      }
    };

    // Pause auto-scroll on hover or interaction
    galleryGrid.addEventListener('mouseenter', stopAutoScroll);
    galleryGrid.addEventListener('mouseleave', () => {
      if (!isDown) startAutoScroll();
    });
    galleryGrid.addEventListener('touchstart', stopAutoScroll, { passive: true });
    galleryGrid.addEventListener('touchend', () => {
      if (!isDown) startAutoScroll();
    }, { passive: true });

    // Viewport observer for gallery section
    const gallerySection = document.getElementById('galeria');
    if (gallerySection && 'IntersectionObserver' in window) {
      const galleryObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isGalleryInView = entry.isIntersecting;
          if (isGalleryInView) {
            startAutoScroll();
          } else {
            stopAutoScroll();
          }
        });
      }, { threshold: 0.1 });
      galleryObserver.observe(gallerySection);
    } else {
      isGalleryInView = true;
      startAutoScroll(); // init
    }

  }

  // --- RESERVATION LOGIC (2-Step Anti-Popup Concierge Flow) ---
  if (reservationForm) {
    // Dynamic listener on comensales input for Imperial Table banner
    const peopleInput = reservationForm.querySelector('input[name="people"]') as HTMLInputElement | null;
    const imperialBanner = document.getElementById('imperial-table-notice');
    if (peopleInput && imperialBanner) {
      const handlePaxChange = () => {
        const pax = parseInt(peopleInput.value, 10);
        if (!isNaN(pax) && pax > 6) {
          imperialBanner.style.display = 'block';
        } else {
          imperialBanner.style.display = 'none';
        }
      };
      peopleInput.addEventListener('input', handlePaxChange);
      peopleInput.addEventListener('change', handlePaxChange);
      handlePaxChange();
    }

    reservationForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = reservationForm.querySelector('button[type="submit"]') as HTMLButtonElement | null;
      if (submitBtn) submitBtn.disabled = true;

      const formData = new FormData(reservationForm as HTMLFormElement);
      const name = (formData.get('name') as string || '').trim();
      const email = (formData.get('email') as string || '').trim();
      const phone = (formData.get('phone') as string || '').trim();
      const date = (formData.get('date') as string || '').trim();
      const time = (formData.get('time') as string || '').trim();
      const peopleRaw = formData.get('people') as string || '';
      const people = parseInt(peopleRaw, 10);
      const occasion = (formData.get('occasion') as string || '').trim();

      // Validate required fields
      if (!name || !email || !date || !time || isNaN(people)) {
        showProblemToast({
          type: 'https://api.sabeaperu.es/errors/validation',
          title: 'Datos de reserva incompletos',
          status: 422,
          detail: 'Por favor, complete todos los campos obligatorios (*).'
        });
        if (submitBtn) submitBtn.disabled = false;
        return;
      }

      // Validate guest count boundaries
      const guestCheck = validateGuestCount(people);
      if (!guestCheck.valid) {
        showProblemToast({
          type: 'https://api.sabeaperu.es/errors/invalid-guest-count',
          title: 'Número de comensales no válido',
          status: 422,
          detail: guestCheck.error || 'El número de comensales debe ser un número entero entre 1 y 20.'
        });
        if (submitBtn) submitBtn.disabled = false;
        return;
      }

      // Pre-flight slot capacity re-check against Firestore
      const slotCheck = await checkSlotAvailabilityAtSubmit(date, time);
      if (!slotCheck.available) {
        showProblemToast({
          type: 'https://api.sabeaperu.es/errors/slot-full',
          title: 'Franja horaria completa',
          status: 409,
          detail: 'El aforo máximo de 4 mesas concurrentes ha sido alcanzado.'
        });
        if (submitBtn) submitBtn.disabled = false;
        return;
      }

      // Generate collision-resistant locator (SP-XXXX)
      const locator = generateReservationLocator();

      // Persist reservation in Firestore
      const reservationForDb: ReservationDoc = {
        customer_name: name,
        customer_email: email,
        customer_phone: phone || undefined,
        reservation_date: date,
        reservation_time: time,
        number_of_people: people,
        occasion: occasion || undefined,
        locator,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      try {
        await addDoc(collection(db, 'reservations'), reservationForDb);

        // Build voluntary WhatsApp confirmation URL
        const restaurantPhone = siteCache['contact_whatsapp'] || '34662125650';
        const waUrl = buildWhatsAppReservationUrl({
          phone: restaurantPhone,
          locator,
          name,
          date,
          time,
          people
        });

        // Render confirmation card (replacing/covering form, zero window.open)
        const cardHtml = renderConfirmationCardHtml({
          locator,
          customer_name: name,
          customer_email: email,
          customer_phone: phone || undefined,
          reservation_date: date,
          reservation_time: time,
          number_of_people: people,
          occasion: occasion || undefined,
          waUrl,
          isImperial: guestCheck.isImperial,
          imperialNotice: guestCheck.notice
        });

        const confirmationCard = document.getElementById('reservation-confirmation-card');
        if (confirmationCard) {
          confirmationCard.outerHTML = cardHtml;
        } else {
          reservationForm.insertAdjacentHTML('afterend', cardHtml);
        }
        (reservationForm as HTMLFormElement).style.display = 'none';

      } catch (error) {
        console.error('Error al reservar:', error);
        showProblemToast({
          type: 'https://api.sabeaperu.es/errors/reservation-mutation',
          title: 'Error de conexión',
          status: 500,
          detail: 'No hemos podido registrar su solicitud en este momento. Por favor, contacte directamente por teléfono o WhatsApp.'
        });
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  // --- LIFECYCLE VISIBILITY LISTENER ---
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      stopHeroSlideshow();
      stopAutoScroll();
    } else {
      if (isHeroInView) startHeroSlideshow();
      if (isGalleryInView) startAutoScroll();
    }
  });
});
