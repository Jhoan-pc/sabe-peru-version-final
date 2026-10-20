import { db } from './firebase';
import { collection, query, getDocs, addDoc } from 'firebase/firestore';
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

interface SiteContentItem {
    key?: string;
    content?: string;
    type?: string;
}

// Using Firebase from './firebase.ts'

// Carousel and Animation Logic
document.addEventListener('DOMContentLoaded', () => {
    // --- RESERVATION UI ---
    initReservationUI('reservation-form', 'time-slots-container');

    let siteCache: Record<string, string> = {};

    // --- DYNAMIC CONTENT ---
    // The landing page uses static content tailored for hotel guests as fallback.
    // It pulls text from Firestore using keys prefixed with 'exp_' (e.g., exp_hero_title).
    // If the content is empty or doesn't exist, it keeps the default hardcoded HTML.
    async function initDynamicContent() {
        try {
            const qs = await getDocs(query(collection(db, 'site_content')));
            const data = qs.docs.map(doc => doc.data() as SiteContentItem).filter((item: SiteContentItem) => !!item.key && item.key.startsWith('exp_'));

            data?.forEach(item => {
                if (!item.key) return;
                siteCache[item.key] = item.content || '';
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
            console.warn('Usando contenido estático por defecto (offline o vacío)');
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

    // --- RESERVATION LOGIC (2-Step Anti-Popup Concierge Flow) ---
    const reservationForm = document.getElementById('reservation-form');

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
