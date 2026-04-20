import { createClient } from '@supabase/supabase-js';
import { initReservationUI } from './reservations';

// Initialize Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Carousel and Animation Logic
document.addEventListener('DOMContentLoaded', () => {
    // --- RESERVATION UI ---
    initReservationUI('reservation-form', 'time-slots-container');

    let siteCache: Record<string, string> = {};

    // --- DYNAMIC CONTENT ---
    // The landing page uses static content tailored for hotel guests as fallback.
    // It pulls text from Supabase using keys prefixed with 'exp_' (e.g., exp_hero_title).
    // If the content is empty or doesn't exist, it keeps the default hardcoded HTML.
    async function initDynamicContent() {
        try {
            const { data, error } = await supabase.from('site_content').select('*').like('key', 'exp_%');
            if (error) throw error;

            data?.forEach(item => {
                siteCache[item.key] = item.content;
                const el = document.getElementById(item.key.replace(/_/g, '-'));
                // Only replace if item.content actually has text/url, otherwise keep fallback
                if (el && item.content && item.content.trim() !== '') {
                    if (item.type === 'html') {
                        el.innerHTML = item.content;
                    } else if (item.type === 'image') {
                        if (el.tagName === 'IMG') {
                            (el as HTMLImageElement).src = item.content;
                        } else {
                            // Specifically handles the hero background div using URL
                            el.style.backgroundImage = `url('${item.content}')`;
                        }
                    } else {
                        el.textContent = item.content;
                    }
                }
            });
        } catch (err) {
            console.warn('Usando contenido estático por defecto (Supabase offline o vacío)');
        }
    }

    initDynamicContent();

    // Carousel
    // Carousel
    const track = document.getElementById('carousel-track') as HTMLDivElement;
    const slides = Array.from(document.querySelectorAll('.carousel-slide')) as HTMLDivElement[];
    const nextBtn = document.querySelector('.next-btn') as HTMLButtonElement;
    const prevBtn = document.querySelector('.prev-btn') as HTMLButtonElement;
    const indicatorsContainer = document.getElementById('carousel-indicators') as HTMLDivElement;

    if (track && slides.length > 0) {
        let currentIndex = 0;

        // Create indicators
        slides.forEach((_, index) => {
            const indicator = document.createElement('div');
            indicator.classList.add('indicator');
            if (index === 0) indicator.classList.add('active');
            indicator.addEventListener('click', () => {
                goToSlide(index);
            });
            indicatorsContainer.appendChild(indicator);
        });

        const indicators = Array.from(document.querySelectorAll('.indicator'));

        function updateIndicators(index: number) {
            indicators.forEach((ind, i) => {
                if (i === index) ind.classList.add('active');
                else ind.classList.remove('active');
            });
        }

        function goToSlide(index: number) {
            if (index < 0) index = slides.length - 1;
            if (index >= slides.length) index = 0;

            currentIndex = index;
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
            updateIndicators(currentIndex);
        }

        nextBtn.addEventListener('click', () => {
            goToSlide(currentIndex + 1);
        });

        prevBtn.addEventListener('click', () => {
            goToSlide(currentIndex - 1);
        });

        // Touch support for swipe
        let startX = 0;
        let isDragging = false;

        track.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
        }, { passive: true });

        track.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const currentX = e.touches[0].clientX;
            const diff = startX - currentX;

            // threshold
            if (diff > 50) {
                goToSlide(currentIndex + 1);
                isDragging = false;
            } else if (diff < -50) {
                goToSlide(currentIndex - 1);
                isDragging = false;
            }
        }, { passive: true });

        track.addEventListener('touchend', () => {
            isDragging = false;
        });
    }

    // Scroll Animations (Intersection Observer)
    const animElements = document.querySelectorAll('.scroll-anim');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        animElements.forEach(el => observer.observe(el));
    } else {
        // Fallback for browsers without IntersectionObserver
        animElements.forEach(el => el.classList.add('visible'));
    }

    // --- RESERVATION LOGIC ---
    const reservationForm = document.getElementById('reservation-form');
    const formMessage = document.getElementById('form-message');

    if (reservationForm) {
        reservationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = reservationForm.querySelector('button[type="submit"]') as HTMLButtonElement | null;

            if (submitBtn) submitBtn.disabled = true;
            if (formMessage) {
                formMessage.textContent = 'Procesando su solicitud...';
                formMessage.style.color = 'var(--gold)';
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
                const waMessage = `Hola, quisiera confirmar mi reserva (Invitación Hotel) en Sabe a Perú:
📅 Fecha: ${reservationForDb.reservation_date}
⏰ Hora: ${reservationForDb.reservation_time}
👤 Personas: ${reservationForDb.number_of_people}
📝 Nombre: ${reservationForDb.customer_name}
🎉 Ocasión: ${reservationForDb.occasion}`;

                const waUrl = `https://wa.me/${restaurantPhone}?text=${encodeURIComponent(waMessage)}`;

                window.open(waUrl, '_blank');

                if (formMessage) {
                    formMessage.innerHTML = '¡Reserva recibida! Si WhatsApp no se abre autmáticamente, confirme aquí:<br>';

                    const waBtn = document.createElement('a');
                    waBtn.href = waUrl;
                    waBtn.target = '_blank';
                    waBtn.style.marginTop = '15px';
                    waBtn.style.display = 'inline-block';
                    waBtn.style.textDecoration = 'none';
                    waBtn.style.padding = '10px 20px';
                    waBtn.style.background = '#25D366';
                    waBtn.style.color = 'white';
                    waBtn.style.borderRadius = '5px';
                    waBtn.style.fontWeight = 'bold';
                    waBtn.textContent = 'Confirmar por WhatsApp →';

                    formMessage.appendChild(waBtn);
                }

                (reservationForm as HTMLFormElement).reset();

            } catch (error) {
                console.error('Error al reservar:', error);
                if (formMessage) {
                    formMessage.textContent = 'Hubo un error de conexión al enviar. Por favor, contáctenos directamente por WhatsApp.';
                    formMessage.style.color = '#ff6b6b';
                }
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    // --- NAVIGATION LOGIC (Mobile Menu & Scroll) ---
    const header = document.querySelector('.header');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');

    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuBtn.classList.toggle('active');
            mobileNav.classList.toggle('active');
            document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
        });

        const mobileLinks = mobileNav.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuBtn.classList.remove('active');
                mobileNav.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }
});
