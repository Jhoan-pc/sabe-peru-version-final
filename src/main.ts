// Main.ts - Logic restored to classic Grid Layout
import { createClient } from '@supabase/supabase-js';
import { initReservationUI } from './reservations';

// Initialize Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

document.addEventListener('DOMContentLoaded', () => {
  // --- RESERVATION UI INITIALIZATION ---
  initReservationUI('reservation-form', 'time-slots-container');

  // --- NAVIGATION ---
  const header = document.getElementById('main-header');
  const navLinks = document.querySelector('.nav-links');
  const reservationForm = document.getElementById('reservation-form');
  const formMessage = document.getElementById('form-message');
  let siteCache: Record<string, string> = {};

  // --- DYNAMIC CONTENT ---
  async function initDynamicContent() {
    try {
      const { data, error } = await supabase.from('site_content').select('*');
      if (error) throw error;

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
               document.documentElement.style.setProperty('--font-serif', item.content);
            } else if (item.key === 'font_text') {
               document.documentElement.style.setProperty('--font-sans', item.content);
            }
          }
        } catch (innerErr) {
          console.error("Error processing dynamic element:", item.key, innerErr);
        }
      });
    } catch (err) {
      console.warn('Usando contenido estático (Supabase offline o vacío)');
    }
  }

  initDynamicContent();

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

  // --- MENU LOGIC (Only if menu grid exists) ---
  if (menuGrid) {
    const filterBtns = document.querySelectorAll('.filter-btn');

    async function loadMenu(category: string, tagFilter: string | null = null) {
      menuGrid!.innerHTML = '<div class="loading-state">Actualizando selección...</div>';

      try {
        let query = supabase
          .from('menu_items')
          .select('*')
          .eq('is_available', true)
          .eq('category', category)
          .order('sort_order', { ascending: true });

        if (tagFilter) {
          query = query.contains('tags', [tagFilter]);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (!data || data.length === 0) {
          const msg = tagFilter
            ? `No encontramos platos con la etiqueta "${tagFilter}" en este momento.`
            : `Próximamente novedades en ${category}s.`;
          menuGrid!.innerHTML = `<div class="loading-state">${msg}</div>`;
          return;
        }

        // Group by subcategory
        const groups: { [key: string]: any[] } = {};
        data.forEach((item: any) => {
          const sub = item.subcategory || 'OTROS';
          if (!groups[sub]) groups[sub] = [];
          groups[sub].push(item);
        });

        const tagIcons: { [key: string]: string } = {
          'pescado': '<span class="menu-tag" title="Pescado">🐟</span>',
          'marisco': '<span class="menu-tag" title="Marisco">🦐</span>',
          'carne': '<span class="menu-tag" title="Carne">🥩</span>',
          'pollo': '<span class="menu-tag" title="Pollo">🍗</span>',
          'picante': '<span class="menu-tag" title="Picante">🌶️</span>',
          'gluten-free': '<span class="menu-tag" title="Sin Gluten">🌾</span>'
        };

        let html = '';
        if (tagFilter) {
          html += `<div class="filter-notice">Filtrando por: <strong>${tagFilter.toUpperCase()}</strong> <a href="#" onclick="window.location.search=''; return false;" style="color:var(--color-gold); margin-left:10px; font-size:0.8em;">(Ver Todo)</a></div>`;
        }

        for (const sub in groups) {
          html += `<div class="menu-subcategory-title">${sub}</div>`;
          html += groups[sub].map((item: any) => {
            const hasNumericPrice = item.price > 0;
            let priceDisplay = hasNumericPrice ? `${parseFloat(item.price).toFixed(2)}€` : item.description;
            let descriptionDisplay = hasNumericPrice ? (item.description || '') : '';

            // Handle very long dual prices (optional styling class)
            const priceClass = !hasNumericPrice ? 'menu-item-price dual' : 'menu-item-price';

            const icons = (item.tags || []).map((tag: string) => tagIcons[tag] || '').join('');

            const photoBtn = item.image_url ? `
              <button class="item-photo-btn" data-img="${item.image_url}" data-name="${item.name}" data-desc="${item.description || ''}" title="Ver foto del plato">
                <span style="font-size: 1.1em; margin-right: 3px;">📸</span> Ver
              </button>
            ` : '';

            return `
              <div class="menu-item reveal active">
                <div class="menu-item-header">
                  <h3>${item.name}${icons}${photoBtn}</h3>
                  <span class="${priceClass}">${priceDisplay}</span>
                </div>
                ${descriptionDisplay ? `
                <div class="menu-item-info">
                  <p>${descriptionDisplay}</p>
                </div>` : ''}
              </div>
            `;
          }).join('');
        }
        menuGrid!.innerHTML = html;

        // --- PHOTO MODAL LOGIC ---
        const photoBtns = document.querySelectorAll('.item-photo-btn');
        const photoModal = document.getElementById('menu-photo-modal');
        const modalImg = photoModal?.querySelector('.menu-modal-img') as HTMLImageElement;
        const modalName = photoModal?.querySelector('.modal-item-name');
        const modalDesc = photoModal?.querySelector('.modal-item-desc');
        const closeModalBtn = photoModal?.querySelector('.close-menu-modal');

        photoBtns.forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const target = e.currentTarget as HTMLElement;
            const imgUrl = target.getAttribute('data-img');
            const name = target.getAttribute('data-name');
            const desc = target.getAttribute('data-desc');

            if (photoModal && modalImg && imgUrl) {
              modalImg.src = imgUrl;
              if (modalName) modalName.textContent = name || '';
              if (modalDesc) modalDesc.textContent = desc || '';
              photoModal.classList.add('active');
              document.body.style.overflow = 'hidden'; // Lock scroll
            }
          });
        });

        const closeFunc = () => {
          photoModal?.classList.remove('active');
          document.body.style.overflow = '';
        };

        closeModalBtn?.addEventListener('click', closeFunc);
        photoModal?.addEventListener('click', (e) => {
          if (e.target === photoModal) closeFunc();
        });

      } catch (err) {
        console.error('Error loading menu:', err);
        menuGrid!.innerHTML = '<div class="loading-state">Estamos ordenando los sabores. Por favor, refresca en un momento.</div>';
      }
    }

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.getAttribute('data-category') || 'comida';
        // Clear tag filter when clicking category buttons
        loadMenu(cat, null);
        // Optional: Update URL to remove tag? Not strictly necessary for SPA feel unless we want persistent state.
      });
    });

    // Check URL params for initial category
    const urlParams = new URLSearchParams(window.location.search);
    const initialCat = urlParams.get('cat') || 'comida';
    const initialTag = urlParams.get('tag'); // Get tag from URL

    // Set active button (only if no tag, or default to cat)
    filterBtns.forEach(btn => {
      if (btn.getAttribute('data-category') === initialCat) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Initial load
    loadMenu(initialCat, initialTag);
  }

  // --- GALLERY LOGIC (Grid Layout) ---
  const galleryGrid = document.querySelector('.gallery-grid');

  if (galleryGrid) {
    async function loadGallery() {
      const bucketName = 'restaurante-assets';
      try {
        const { data, error } = await supabase.storage.from(bucketName).list();

        if (error || !data) { console.warn('Gallery error or empty'); return; }

        // Filter and Sort
        const galleryFiles = data
          .filter((file: any) => file.name.toLowerCase().startsWith('galeria') && !file.name.toLowerCase().includes('galeria2'))
          .sort((a: any, b: any) => {
            const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
            const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');
            return numA - numB;
          });

        if (galleryFiles.length > 0) {
          galleryGrid!.innerHTML = ''; // Clear default

          galleryFiles.forEach((file: any, index: number) => {
            const fileUrl = supabase.storage.from(bucketName).getPublicUrl(file.name).data.publicUrl;
            const isVideo = file.metadata?.mimetype?.startsWith('video') || file.name.endsWith('.mp4');

            // Layout classes based on index (Original premium grid)
            let layoutClass = '';
            if (index === 0) layoutClass = 'tall'; // First item tall
            if (index === 3) layoutClass = 'wide'; // Fourth item wide

            const item = document.createElement('div');
            item.className = `gallery-item ${layoutClass} reveal active`;

            const baseName = file.name.split('.')[0].toLowerCase();
            const captions: Record<string, { title: string, desc: string, linkStr?: string }> = {
              'galeria1': { title: 'La Experiencia', desc: 'Decoración milenaria en cada rincón, inspirada en las enigmáticas Líneas de Nazca.', linkStr: '<a href="/#experiencia" class="gallery-overlay-link">Ver Concepto</a>' },
              'galeria3': { title: 'Mixología 🍸', desc: 'Nuestros cócteles de autor te sorprenderán. El acompañamiento ideal para la experiencia peruana.', linkStr: '<a href="carta.html?cat=coctel" class="gallery-overlay-link">Ver Cócteles</a>' },
              'galeria4': { title: 'El Fuego', desc: 'Lomo saltado al rojo vivo. Técnicas asiáticas fusionadas con la sazón criolla tradicional.' },
              'galeria5': { title: 'El Dulce Final 🍰', desc: 'Delicados postres limeños. El cierre perfecto que no te puedes perder.', linkStr: '<a href="carta.html?cat=comida" class="gallery-overlay-link">Nuestros Postres</a>' },
              'galeria6': { title: 'Puros Mares', desc: 'El ceviche clásico interpretado con la pesca del día más fresca.' },
              'galeria10': { title: 'Artesanía Visual', desc: 'Detalles que evocan la costa y la sierra, preparados para deleitarte.', linkStr: '<a href="carta.html" class="gallery-overlay-link">Descubrir la Carta</a>' }
            };

            const fallbackCaptions = [
              { title: 'Nuestra Esencia', desc: 'Momentos y sabores inolvidables esperándote.' },
              { title: 'Alta Cocina', desc: 'Respeto profundo por el ingrediente y pasión por el emplatado.' },
              { title: 'Sabe a Perú', desc: 'Un viaje culinario que tocará todos tus sentidos.' }
            ];

            const caption = captions[baseName] || fallbackCaptions[index % fallbackCaptions.length];

            const overlayHTML = `
              <div class="gallery-overlay">
                <span class="gallery-overlay-title">${caption.title}</span>
                <span class="gallery-overlay-desc">${caption.desc}</span>
                ${caption.linkStr ? caption.linkStr : ''}
              </div>
            `;

            if (isVideo) {
              item.innerHTML = `<video src="${fileUrl}" muted loop playsinline draggable="false" onmouseover="this.play()" onmouseout="this.pause()" style="transform: translateZ(0); will-change: transform;"></video>${overlayHTML}`;
            } else {
              item.innerHTML = `<img src="${fileUrl}" alt="${caption.title}" draggable="false" loading="lazy" decoding="async" onload="this.style.opacity=1" style="transform: translateZ(0); will-change: transform; transition: opacity 0.3s, transform 0.6s ease, filter 0.6s ease; opacity: 0;"><div class="skeleton-bg" style="position:absolute; inset:0; background:#111; z-index:-1;"></div>${overlayHTML}`;
            }
            galleryGrid!.appendChild(item);
          });
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

  }

  // --- RESERVATION LOGIC ---
  if (reservationForm) {
    reservationForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = reservationForm.querySelector('button[type="submit"]') as HTMLButtonElement | null;

      if (submitBtn) submitBtn.disabled = true;
      if (formMessage) {
        formMessage.textContent = 'Procesando su solicitud...';
        formMessage.className = 'form-message';
      }

      const formData = new FormData(reservationForm as HTMLFormElement);


      const reservationForDb = {
        customer_name: formData.get('name'),
        customer_email: formData.get('email'),
        reservation_date: formData.get('date'),
        reservation_time: formData.get('time'),
        number_of_people: parseInt(formData.get('people') as string),
        occasion: formData.get('occasion'),
        status: 'pending'
      };

      try {
        const { error } = await supabase
          .from('reservations')
          .insert([reservationForDb]);

        if (error) throw error;

        // WhatsApp Integration
        const restaurantPhone = siteCache['contact_whatsapp'] || "34662125650";
        const waMessage = `Hola, quisiera confirmar mi reserva en Sabe a Perú:
📅 Fecha: ${reservationForDb.reservation_date}
⏰ Hora: ${reservationForDb.reservation_time}
👤 Personas: ${reservationForDb.number_of_people}
📝 Nombre: ${reservationForDb.customer_name}
${reservationForDb.occasion ? `🎉 Ocasión: ${reservationForDb.occasion}` : ''}`;

        const waUrl = `https://wa.me/${restaurantPhone}?text=${encodeURIComponent(waMessage)}`;

        // Try to open WhatsApp
        const newWindow = window.open(waUrl, '_blank');

        if (formMessage) {
          formMessage.innerHTML = '¡Reserva guardada! Confirmando en WhatsApp...<br>';

          // Add manual button in case of popup blocker
          const waBtn = document.createElement('a');
          waBtn.href = waUrl;
          waBtn.target = '_blank';
          waBtn.className = 'btn-gold-fill';
          waBtn.style.marginTop = '15px';
          waBtn.style.display = 'inline-block';
          waBtn.style.textDecoration = 'none';
          waBtn.textContent = 'Confirmar por WhatsApp →';

          formMessage.appendChild(waBtn);
          formMessage.className = 'form-message success';
        }

        if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
          // Popup blocked
          console.log("Popup blocked");
        }

        (reservationForm as HTMLFormElement).reset();

      } catch (error) {
        console.error('Error al reservar:', error);
        if (formMessage) {
          formMessage.textContent = 'Hubo un error al enviar la reserva. Por favor, llámanos directamente.';
          formMessage.classList.add('error');
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
});
