import { db, auth } from './firebase';
import {
    collection,
    query,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    deleteDoc,
    setDoc,
    orderBy
} from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

// ============================================================================
// CANONICAL CONTRACTS & INTERFACES (SSOT: specs/admin-spec.md & openapi.yaml)
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

export interface DishItem {
    id: string;
    name: string;
    description?: string;
    price: number;
    category: 'comida' | 'coctel' | 'bebida' | string;
    subcategory?: string;
    sort_order?: number;
    tags?: AllergenTag[];
    is_available: boolean;
    image_url?: string;
    created_at?: string;
}

export interface DishItemInput {
    name: string;
    description: string;
    price: number;
    category: string;
    subcategory: string;
    sort_order: number;
    tags: AllergenTag[];
    is_available: boolean;
    image_url: string;
    created_at?: string;
}

export interface GalleryItem {
    id: string;
    image_url: string;
    secure_url: string;
    public_id?: string;
    created_at: string;
    title?: string;
    caption_title?: string;
    description?: string;
    caption_desc?: string;
}

export interface ReservationAdminItem {
    id: string;
    customer_name?: string;
    name?: string;
    customer_email?: string;
    email?: string;
    customer_phone?: string;
    phone?: string;
    reservation_date?: string;
    date?: string;
    reservation_time?: string;
    time?: string;
    number_of_people?: number;
    people?: number;
    occasion?: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    locator?: string;
    created_at?: string;
}

export interface SiteContentItem {
    key: string;
    content: string;
    type?: 'text' | 'html' | 'image';
    updated_at?: string | Date;
}

export interface ProblemDetails {
    type: string;
    title: string;
    status: number;
    detail?: string;
    instance?: string;
    invalid_params?: Array<{ name: string; reason: string }>;
}

export interface FileValidationResult {
    valid: boolean;
    error?: string;
}

export interface CloudinaryUploadResponse {
    secure_url: string;
    public_id?: string;
}

const cloudName = 'dhvbqs2ba';
const uploadPreset = 'sabeaperu_firm';

// ============================================================================
// PURE CONTRACT: normalizeCloudinaryUrl
// ============================================================================

/**
 * Normaliza determinísticamente URLs de Cloudinary inyectando transformaciones oficiales Quiet Luxury:
 * f_auto,q_auto,w_{width},c_limit y purgando parámetros de consulta (?v=...).
 *
 * Invariantes formales:
 * 1. Retorna '' si la URL es falsy o no es de tipo string.
 * 2. Retorna la URL original si no contiene 'cloudinary.com' o no contiene '/upload/'.
 * 3. Descarta segmentos de transformación existentes para evitar anidación/duplicación.
 * 4. Idempotente: normalizeCloudinaryUrl(normalizeCloudinaryUrl(url)) === normalizeCloudinaryUrl(url).
 */
export function normalizeCloudinaryUrl(url: string | null | undefined, width = 800): string {
    if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
        return url || '';
    }

    // 1. Purgar query string (?v=...)
    const cleanUrl = url.split('?')[0];

    // 2. Localizar el punto de inyección /upload/
    const uploadIndex = cleanUrl.indexOf('/upload/');
    if (uploadIndex === -1) return cleanUrl;

    const base = cleanUrl.substring(0, uploadIndex + 8);
    let rest = cleanUrl.substring(uploadIndex + 8);

    // 3. Descartar transformaciones previas si existen (indicadas por caracter '_')
    const parts = rest.split('/');
    if (parts.length > 1 && parts[0].includes('_')) {
        parts.shift();
        rest = parts.join('/');
    }

    // 4. Inyectar directiva oficial
    return `${base}f_auto,q_auto,w_${width},c_limit/${rest}`;
}

// ============================================================================
// FILE VALIDATION CONTRACT (Budget: 10 MB, JPEG/PNG/WebP)
// ============================================================================

export function validateUploadFile(file: File | null | undefined): FileValidationResult {
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

// ============================================================================
// TOAST & RFC 9457 NOTIFICATION ENGINE (Zero alert() calls)
// ============================================================================

export function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function createProblemDetails(params: ProblemDetails): Readonly<ProblemDetails> {
    if (!params.type || typeof params.type !== 'string') {
        throw new Error('ProblemDetails requires a string "type" URI');
    }
    if (!params.title || typeof params.title !== 'string') {
        throw new Error('ProblemDetails requires a string "title"');
    }
    if (typeof params.status !== 'number' || !Number.isInteger(params.status) || params.status < 400 || params.status > 599) {
        throw new Error('ProblemDetails requires an HTTP error status code (400-599)');
    }
    return Object.freeze({ ...params });
}

export function renderProblemToastHtml(problem: ProblemDetails): string {
    const icon = problem.status >= 500 ? '⚠️' : 'ℹ️';
    const detailHtml = problem.detail
        ? `<div class="toast-detail">${escapeHtml(problem.detail)}</div>`
        : '';

    return `<div class="toast error rfc-9457" role="alert" data-status="${problem.status}">
        <span class="toast-icon">${icon}</span>
        <div class="toast-content">
            <div class="toast-title">${escapeHtml(problem.title)}</div>
            ${detailHtml}
        </div>
    </div>`;
}

export function showProblemToast(problem: ProblemDetails): void {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = renderProblemToastHtml(problem).trim();
    const toast = wrapper.firstElementChild as HTMLElement;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

export function showToast(message: string, type: 'success' | 'error' = 'success'): void {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span>
        <span class="toast-message">${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function setLoading(button: HTMLButtonElement, isLoading: boolean, text: string): void {
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalHtml = button.innerHTML;
        button.innerHTML = `<span class="spinner"></span> ${text}...`;
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalHtml || button.innerHTML;
    }
}

// ============================================================================
// ALLERGEN CHIPS INTERACTION ENGINE
// ============================================================================

export function initAllergenChips(): void {
    const container = document.getElementById('allergen-chips-container');
    if (!container) return;

    let chips = container.querySelectorAll<HTMLButtonElement>('.tag-chip');
    if (chips.length === 0) {
        container.innerHTML = '';
        OFFICIAL_ALLERGEN_TAGS.forEach(tag => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'tag-chip';
            btn.setAttribute('data-tag', tag);
            btn.textContent = tag.toUpperCase();
            container.appendChild(btn);
        });
        chips = container.querySelectorAll<HTMLButtonElement>('.tag-chip');
    }

    chips.forEach(chip => {
        chip.onclick = (e) => {
            e.preventDefault();
            chip.classList.toggle('active');
        };
    });
}

export function resetAllergenChips(): void {
    const chips = document.querySelectorAll<HTMLButtonElement>('#allergen-chips-container .tag-chip');
    chips.forEach(chip => chip.classList.remove('active'));
}

export function populateAllergenChips(tags: string[] | string = []): void {
    resetAllergenChips();
    const tagList: string[] = Array.isArray(tags)
        ? tags
        : typeof tags === 'string'
            ? tags.split(',').map(t => t.trim().toLowerCase())
            : [];

    tagList.forEach(rawTag => {
        const cleanTag = rawTag.toLowerCase();
        const chip = document.querySelector<HTMLButtonElement>(`#allergen-chips-container .tag-chip[data-tag="${cleanTag}"]`);
        if (chip) {
            chip.classList.add('active');
        }
    });
}

export function getSelectedAllergenTags(): AllergenTag[] {
    const activeChips = Array.from(document.querySelectorAll<HTMLButtonElement>('#allergen-chips-container .tag-chip.active'));
    return activeChips
        .map(chip => chip.getAttribute('data-tag') as AllergenTag)
        .filter((t): t is AllergenTag => (OFFICIAL_ALLERGEN_TAGS as readonly string[]).includes(t));
}

// ============================================================================
// CLOUDINARY DIRECT REST CLIENT
// ============================================================================

async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
    });

    if (!res.ok) {
        throw new Error(`Error en Cloudinary (${res.status}): ${res.statusText}`);
    }

    const data = await res.json();
    return {
        secure_url: normalizeCloudinaryUrl(data.secure_url, 800),
        public_id: data.public_id || ''
    };
}

// ============================================================================
// DOM LIFECYCLE & APPLICATION INITIALIZATION
// ============================================================================

let currentMode: 'create' | 'edit' = 'create';
let currentItemId: string | null = null;
let currentDishBlobUrl: string | null = null;
let currentGalleryBlobUrl: string | null = null;

if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async () => {
        const loginScreen = document.getElementById('login-screen') as HTMLElement | null;
        if (!loginScreen) return; // Exit cleanly if running outside admin context

        const dashboardScreen = document.getElementById('dashboard-screen') as HTMLElement;
        const loginForm = document.getElementById('login-form') as HTMLFormElement;
        const loginMessage = document.getElementById('login-message') as HTMLElement;
        const logoutBtn = document.getElementById('logout-btn') as HTMLButtonElement;

        // Initialize Allergen Chips
        initAllergenChips();

        // Check authentication session
        onAuthStateChanged(auth, (user) => {
            if (user) {
                showDashboard();
            } else {
                loginScreen.style.display = 'flex';
            }
        });

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = (document.getElementById('login-email') as HTMLInputElement).value;
            const password = (document.getElementById('login-password') as HTMLInputElement).value;
            const submitBtn = loginForm.querySelector('button') as HTMLButtonElement;

            setLoading(submitBtn, true, 'Verificando');

            let authError: Error | null = null;
            try {
                await signInWithEmailAndPassword(auth, email, password);
            } catch (err) {
                authError = err as Error;
            }

            setLoading(submitBtn, false, 'Ingresar');

            if (authError) {
                loginMessage.textContent = 'Error: ' + authError.message;
                showProblemToast({
                    type: 'https://api.sabeaperu.es/errors/auth-failed',
                    title: 'Credenciales incorrectas',
                    status: 401,
                    detail: authError.message
                });
            } else {
                showToast('Bienvenido, Administrador');
                showDashboard();
            }
        });

        logoutBtn.addEventListener('click', async () => {
            await signOut(auth);
            window.location.reload();
        });

        function showDashboard() {
            if (loginScreen) loginScreen.style.display = 'none';
            if (dashboardScreen) dashboardScreen.style.display = 'block';
            loadMenu();
        }

        // --- NAVIGATION ---
        const navBtns = document.querySelectorAll<HTMLButtonElement>('.nav-btn');
        const views = document.querySelectorAll<HTMLElement>('.dashboard-view');

        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');
                navBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                views.forEach(v => {
                    v.classList.remove('active');
                    if (v.id === targetId) v.classList.add('active');
                });

                if (targetId === 'menu-view') loadMenu();
                if (targetId === 'home-view') loadHomePageContent();
                if (targetId === 'experiencia-view') loadExperienciaContent();
                if (targetId === 'gallery-view') loadGalleryAdmin();
                if (targetId === 'reservations-view') loadReservations();
            });
        });

        // --- MENU MANAGEMENT ---
        const menuTableBody = document.getElementById('menu-table-body') as HTMLElement;
        const addItemBtn = document.getElementById('add-item-btn') as HTMLButtonElement;
        const searchInput = document.getElementById('search-input') as HTMLInputElement;
        const filterCategory = document.getElementById('filter-category') as HTMLSelectElement;
        const modal = document.getElementById('item-modal') as HTMLElement;
        const closeModal = document.querySelector('.close-modal') as HTMLElement;
        const itemForm = document.getElementById('item-form') as HTMLFormElement;

        let allMenuItems: DishItem[] = [];

        async function loadMenu() {
            if (!menuTableBody) return;
            menuTableBody.innerHTML = '<tr><td colspan="5">Cargando...</td></tr>';

            let data: DishItem[] = [];
            let error: Error | null = null;
            try {
                const qs = await getDocs(query(collection(db, 'menu_items'), orderBy('created_at', 'desc')));
                data = qs.docs.map(d => ({ id: d.id, ...(d.data() as Omit<DishItem, 'id'>) }));
                data.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
            } catch (err) {
                error = err as Error;
            }

            if (error) {
                console.error('Error loading menu:', error);
                menuTableBody.innerHTML = '<tr><td colspan="6">Error al cargar datos. Contáctese con soporte.</td></tr>';
                showProblemToast({
                    type: 'https://api.sabeaperu.es/errors/menu-fetch',
                    title: 'Error al cargar carta',
                    status: 500,
                    detail: error.message
                });
                return;
            }

            allMenuItems = data || [];
            filterAndRenderMenu();
        }

        function filterAndRenderMenu() {
            let filtered = [...allMenuItems];

            if (filterCategory && filterCategory.value !== 'all') {
                filtered = filtered.filter(item => item.category === filterCategory.value);
            }

            if (searchInput && searchInput.value) {
                const q = searchInput.value.toLowerCase();
                filtered = filtered.filter(item =>
                    (item.name || '').toLowerCase().includes(q) ||
                    (item.description || '').toLowerCase().includes(q) ||
                    (item.subcategory || '').toLowerCase().includes(q)
                );
            }

            renderMenuTable(filtered);
        }

        if (searchInput) searchInput.addEventListener('input', filterAndRenderMenu);
        if (filterCategory) filterCategory.addEventListener('change', filterAndRenderMenu);

        function renderMenuTable(items: DishItem[]) {
            if (!menuTableBody) return;
            menuTableBody.innerHTML = '';
            items.forEach(item => {
                const row = document.createElement('tr');
                const photoCol = item.image_url
                    ? `<img src="${normalizeCloudinaryUrl(item.image_url, 120)}" alt="${escapeHtml(item.name)}" style="width:42px; height:42px; object-fit:cover; border-radius:6px; border:1px solid rgba(197, 168, 128, 0.3); display:inline-block; vertical-align:middle;">`
                    : `<div style="width:42px; height:42px; border-radius:6px; background:rgba(255,255,255,0.05); display:inline-flex; align-items:center; justify-content:center; color:#777; font-size:16px; vertical-align:middle;">📷</div>`;
                row.innerHTML = `
                    <td style="width:50px; text-align:center;">${photoCol}</td>
                    <td><strong>${escapeHtml(item.name)}</strong><br><small>${escapeHtml(item.subcategory || '')}</small></td>
                    <td>${escapeHtml(item.category)}</td>
                    <td>${Number(item.price).toFixed(2)} €</td>
                    <td>${item.is_available ? '<span style="color:#81c784">Disponible</span>' : '<span style="color:#e57373">No Disp.</span>'}</td>
                    <td>
                        <button class="btn-edit" data-id="${item.id}">Editar</button>
                        <button class="btn-delete" data-id="${item.id}">Borrar</button>
                    </td>
                `;
                menuTableBody.appendChild(row);
            });

            document.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
                    openEditModal(id, items.find(i => i.id === id));
                });
            });

            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
                    if (confirm('¿Seguro que quieres borrar este plato?')) {
                        deleteItem(id);
                    }
                });
            });
        }

        if (addItemBtn) {
            addItemBtn.addEventListener('click', () => {
                openCreateModal();
            });
        }

        if (closeModal) {
            closeModal.addEventListener('click', () => {
                modal.style.display = 'none';
                resetAllergenChips();
            });
        }

        window.onclick = function (event) {
            if (event.target === modal) {
                modal.style.display = 'none';
                resetAllergenChips();
            }
        };

        function openCreateModal() {
            currentMode = 'create';
            currentItemId = null;
            itemForm.reset();
            resetAllergenChips();

            if (currentDishBlobUrl) {
                URL.revokeObjectURL(currentDishBlobUrl);
                currentDishBlobUrl = null;
            }

            const dishPreviewContainer = document.getElementById('dish-preview-container');
            const dishPreviewImg = document.getElementById('preview-item-image') as HTMLImageElement | null;
            if (dishPreviewContainer) dishPreviewContainer.style.display = 'none';
            if (dishPreviewImg) dishPreviewImg.src = '';

            const modalTitle = document.getElementById('modal-title');
            if (modalTitle) modalTitle.textContent = 'Agregar Nuevo Plato';

            const uploadStatus = document.getElementById('upload-status');
            if (uploadStatus) {
                uploadStatus.textContent = 'Deja vacío si no tiene foto.';
                uploadStatus.style.color = 'inherit';
            }
            modal.style.display = 'block';
        }

        // File change handler with zero-latency preview and 10 MB guard
        const dishFileInput = (document.getElementById('dish-image-file') || document.getElementById('item-image-file')) as HTMLInputElement | null;
        const itemImageUrl = document.getElementById('item-image-url') as HTMLInputElement | null;
        const uploadStatus = document.getElementById('upload-status') as HTMLElement | null;

        if (dishFileInput) {
            dishFileInput.addEventListener('change', async () => {
                if (!dishFileInput.files || dishFileInput.files.length === 0) return;
                const file = dishFileInput.files[0];

                const validation = validateUploadFile(file);
                if (!validation.valid) {
                    showProblemToast({
                        type: 'https://api.sabeaperu.es/errors/invalid-file',
                        title: 'Archivo no permitido',
                        status: 400,
                        detail: validation.error
                    });
                    dishFileInput.value = '';
                    return;
                }

                // Zero-latency local blob preview
                if (currentDishBlobUrl) {
                    URL.revokeObjectURL(currentDishBlobUrl);
                }
                currentDishBlobUrl = URL.createObjectURL(file);

                const dishPreviewContainer = document.getElementById('dish-preview-container');
                const dishPreviewImg = document.getElementById('preview-item-image') as HTMLImageElement | null;
                if (dishPreviewContainer && dishPreviewImg) {
                    dishPreviewImg.src = currentDishBlobUrl;
                    dishPreviewContainer.style.display = 'block';
                }

                if (uploadStatus) {
                    uploadStatus.textContent = 'Subiendo imagen a Cloudinary...';
                    uploadStatus.style.color = 'var(--color-gold)';
                }

                try {
                    const uploadResult = await uploadToCloudinary(file);
                    if (itemImageUrl) {
                        itemImageUrl.value = uploadResult.secure_url;
                    }
                    if (uploadStatus) {
                        uploadStatus.textContent = '✅ Imagen lista para guardar.';
                        uploadStatus.style.color = 'green';
                    }
                    showToast('Imagen subida correctamente a Cloudinary');
                } catch (err) {
                    const uploadError = err as Error;
                    console.error('Error al subir:', uploadError);
                    if (uploadStatus) {
                        uploadStatus.textContent = 'Error al subir la imagen.';
                        uploadStatus.style.color = 'red';
                    }
                    showProblemToast({
                        type: 'https://api.sabeaperu.es/errors/cloudinary-upload',
                        title: 'Error de subida',
                        status: 500,
                        detail: uploadError.message
                    });
                }
            });
        }

        function openEditModal(id: string | null, item?: DishItem) {
            if (!item) {
                console.error('No se encontró el item con ID:', id);
                return;
            }
            currentMode = 'edit';
            currentItemId = id;

            try {
                (document.getElementById('item-name') as HTMLInputElement).value = item.name || '';
                (document.getElementById('item-desc') as HTMLTextAreaElement).value = item.description || '';
                (document.getElementById('item-price') as HTMLInputElement).value = (item.price ?? 0).toString();
                (document.getElementById('item-category') as HTMLSelectElement).value = item.category || 'comida';
                (document.getElementById('item-sub') as HTMLInputElement).value = item.subcategory || '';
                (document.getElementById('item-order') as HTMLInputElement).value = (item.sort_order ?? 0).toString();

                populateAllergenChips(item.tags || []);

                (document.getElementById('item-available') as HTMLInputElement).checked = !!item.is_available;
                if (itemImageUrl) itemImageUrl.value = item.image_url || '';

                const dishPreviewContainer = document.getElementById('dish-preview-container');
                const dishPreviewImg = document.getElementById('preview-item-image') as HTMLImageElement | null;
                if (item.image_url && dishPreviewContainer && dishPreviewImg) {
                    dishPreviewImg.src = normalizeCloudinaryUrl(item.image_url, 400);
                    dishPreviewContainer.style.display = 'block';
                } else if (dishPreviewContainer) {
                    dishPreviewContainer.style.display = 'none';
                }

                const modalTitle = document.getElementById('modal-title');
                if (modalTitle) {
                    if (item.category === 'coctel') modalTitle.textContent = 'Editar Cóctel';
                    else if (item.category === 'bebida') modalTitle.textContent = 'Editar Bebida';
                    else modalTitle.textContent = 'Editar Plato';
                }
                modal.style.display = 'block';
            } catch (err) {
                const error = err as Error;
                console.error('Error abriendo plato:', error);
                showProblemToast({
                    type: 'https://api.sabeaperu.es/errors/modal-open',
                    title: 'Error al abrir plato',
                    status: 500,
                    detail: error.message
                });
            }
        }

        itemForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = itemForm.querySelector('button[type="submit"]') as HTMLButtonElement;

            const name = (document.getElementById('item-name') as HTMLInputElement).value;
            const description = (document.getElementById('item-desc') as HTMLTextAreaElement).value;
            const priceStr = (document.getElementById('item-price') as HTMLInputElement).value;
            const price = priceStr ? parseFloat(priceStr) : 0;

            const category = (document.getElementById('item-category') as HTMLSelectElement).value;
            const subcategory = (document.getElementById('item-sub') as HTMLInputElement).value;

            const orderStr = (document.getElementById('item-order') as HTMLInputElement).value;
            const sort_order = orderStr ? parseInt(orderStr, 10) : 0;

            const tags = getSelectedAllergenTags();
            const is_available = (document.getElementById('item-available') as HTMLInputElement).checked;
            const image_url = itemImageUrl ? itemImageUrl.value : '';

            const itemData: DishItemInput = {
                name,
                description,
                price,
                category,
                subcategory,
                sort_order,
                tags,
                is_available,
                image_url
            };

            setLoading(submitBtn, true, 'Guardando');

            let saveError: Error | null = null;
            try {
                if (currentMode === 'create') {
                    itemData.created_at = new Date().toISOString();
                    await addDoc(collection(db, 'menu_items'), itemData);
                } else if (currentItemId) {
                    await updateDoc(doc(db, 'menu_items', currentItemId), { ...itemData });
                }
            } catch (err) {
                saveError = err as Error;
            }

            setLoading(submitBtn, false, 'Guardar');

            if (saveError) {
                showProblemToast({
                    type: 'https://api.sabeaperu.es/errors/menu-save',
                    title: 'Error al guardar plato',
                    status: 500,
                    detail: saveError.message
                });
            } else {
                showToast(currentMode === 'create' ? 'Plato creado con éxito' : 'Plato actualizado');
                modal.style.display = 'none';
                resetAllergenChips();
                loadMenu();
            }
        });

        async function deleteItem(id: string | null) {
            if (!id) return;
            let delError: Error | null = null;
            try {
                await deleteDoc(doc(db, 'menu_items', id));
            } catch (err) {
                delError = err as Error;
            }

            if (delError) {
                showProblemToast({
                    type: 'https://api.sabeaperu.es/errors/menu-delete',
                    title: 'Error al borrar plato',
                    status: 500,
                    detail: delError.message
                });
            } else {
                showToast('Plato eliminado');
                loadMenu();
            }
        }

        // --- HOME PAGE CONTENT ---
        const homeForm = document.getElementById('home-content-form') as HTMLFormElement;

        async function loadHomePageContent(skipInputs = false) {
            let data: SiteContentItem[] = [];
            let error: Error | null = null;
            try {
                const qs = await getDocs(collection(db, 'site_content'));
                data = qs.docs.map(d => d.data() as SiteContentItem);
            } catch (err) {
                error = err as Error;
            }

            if (error) {
                showProblemToast({
                    type: 'https://api.sabeaperu.es/errors/content-fetch',
                    title: 'Error al cargar contenido',
                    status: 500,
                    detail: error.message
                });
                return;
            }

            data.forEach(item => {
                if (item.type === 'image') {
                    const previewImg = document.getElementById(`preview-${item.key.replace(/_/g, '-')}`) as HTMLImageElement;
                    if (previewImg) {
                        previewImg.src = normalizeCloudinaryUrl(item.content, 400);
                        previewImg.style.display = 'block';
                    }
                } else if (!skipInputs && homeForm) {
                    const input = homeForm.querySelector(`[data-key="${item.key}"]`) as HTMLInputElement | HTMLTextAreaElement;
                    if (input) input.value = item.content;
                }
            });
        }

        async function saveSectionContent(section: HTMLElement, button: HTMLButtonElement) {
            const inputs = section.querySelectorAll('[data-key]');
            const imageInputs = section.querySelectorAll('input[type="file"][data-image-key]') as NodeListOf<HTMLInputElement>;

            setLoading(button, true, 'Guardando');

            try {
                const textUpdates = Array.from(inputs).map(input => ({
                    key: input.getAttribute('data-key'),
                    content: (input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value,
                    updated_at: new Date().toISOString()
                })).filter(update => update.key);

                if (textUpdates.length > 0) {
                    for (const update of textUpdates) {
                        await setDoc(doc(db, 'site_content', update.key!), update, { merge: true });
                    }
                }

                for (const input of Array.from(imageInputs)) {
                    if (input.files && input.files.length > 0) {
                        const file = input.files[0];
                        const key = input.getAttribute('data-image-key');

                        const val = validateUploadFile(file);
                        if (!val.valid) {
                            showProblemToast({
                                type: 'https://api.sabeaperu.es/errors/invalid-file',
                                title: `Archivo inválido: ${key}`,
                                status: 400,
                                detail: val.error
                            });
                            continue;
                        }

                        const uploadRes = await uploadToCloudinary(file);
                        const cleanUrl = normalizeCloudinaryUrl(uploadRes.secure_url, 1200);

                        await setDoc(doc(db, 'site_content', key!), {
                            key: key,
                            content: cleanUrl,
                            type: 'image',
                            updated_at: new Date().toISOString()
                        }, { merge: true });

                        input.value = '';
                    }
                }

                showToast('Sección actualizada con éxito');
                if (section.closest('#home-view')) loadHomePageContent(true);
                if (section.closest('#experiencia-view')) loadExperienciaContent(true);

            } catch (err) {
                const error = err as Error;
                console.error('Error saving section:', error);
                showProblemToast({
                    type: 'https://api.sabeaperu.es/errors/section-save',
                    title: 'Error al guardar sección',
                    status: 500,
                    detail: error.message
                });
            } finally {
                setLoading(button, false, 'Guardar Sección');
            }
        }

        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('btn-save-section')) {
                const section = target.closest('.content-group') as HTMLElement;
                if (section) {
                    saveSectionContent(section, target as HTMLButtonElement);
                }
            }
        });

        if (homeForm) {
            homeForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitBtn = homeForm.querySelector('button[type="submit"]') as HTMLButtonElement;
                const sections = homeForm.querySelectorAll('.content-group');
                setLoading(submitBtn, true, 'Guardando todo');

                for (const section of Array.from(sections)) {
                    const btn = section.querySelector('.btn-save-section') as HTMLButtonElement;
                    await saveSectionContent(section as HTMLElement, btn || submitBtn);
                }
                setLoading(submitBtn, false, 'Guardar Todo');
            });
        }

        // --- EXPERIENCIA PAGE CONTENT ---
        const experienciaForm = document.getElementById('experiencia-content-form') as HTMLFormElement;

        async function loadExperienciaContent(skipInputs = false) {
            let data: SiteContentItem[] = [];
            let error: Error | null = null;
            try {
                const qs = await getDocs(collection(db, 'site_content'));
                data = qs.docs.map(d => d.data() as SiteContentItem).filter(item => item.key && item.key.startsWith('exp_'));
            } catch (err) {
                error = err as Error;
            }

            if (error) {
                showProblemToast({
                    type: 'https://api.sabeaperu.es/errors/content-fetch',
                    title: 'Error al cargar experiencia',
                    status: 500,
                    detail: error.message
                });
                return;
            }

            data.forEach(item => {
                if (item.type === 'image') {
                    const previewImg = document.getElementById(`preview-${item.key.replace(/_/g, '-')}`) as HTMLImageElement;
                    if (previewImg) {
                        previewImg.src = normalizeCloudinaryUrl(item.content, 400);
                        previewImg.style.display = 'block';
                    }
                } else if (!skipInputs && experienciaForm) {
                    const input = experienciaForm.querySelector(`[data-key="${item.key}"]`) as HTMLInputElement | HTMLTextAreaElement;
                    if (input) input.value = item.content;
                }
            });
        }

        if (experienciaForm) {
            experienciaForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitBtn = experienciaForm.querySelector('button[type="submit"]') as HTMLButtonElement;
                const sections = experienciaForm.querySelectorAll('.content-group');
                setLoading(submitBtn, true, 'Guardando todo');

                for (const section of Array.from(sections)) {
                    const btn = section.querySelector('.btn-save-section') as HTMLButtonElement;
                    await saveSectionContent(section as HTMLElement, btn || submitBtn);
                }
                setLoading(submitBtn, false, 'Guardar Todo Experiencia');
            });
        }

        // ====================================================================
        // GALLERY MANAGEMENT (Firestore gallery_items SSOT, Zero Storage)
        // ====================================================================
        const galleryAdminGrid = document.getElementById('gallery-admin-grid');
        const galleryFileInput = (document.getElementById('gallery-image-file') || document.getElementById('gallery-upload-input')) as HTMLInputElement | null;

        async function loadGalleryAdmin() {
            if (!galleryAdminGrid) return;
            galleryAdminGrid.innerHTML = '<div style="grid-column: 1/-1;">Cargando Galería...</div>';

            let data: GalleryItem[] = [];
            let fetchError: Error | null = null;
            try {
                const q = query(collection(db, 'gallery_items'), orderBy('created_at', 'desc'));
                const qs = await getDocs(q);
                data = qs.docs.map(d => ({
                    id: d.id,
                    ...(d.data() as Omit<GalleryItem, 'id'>)
                }));
            } catch (err) {
                fetchError = err as Error;
            }

            if (fetchError) {
                console.error('Error al cargar galería:', fetchError);
                showProblemToast({
                    type: 'https://api.sabeaperu.es/errors/gallery-fetch',
                    title: 'Error al cargar galería',
                    status: 500,
                    detail: fetchError.message
                });
                galleryAdminGrid.innerHTML = '<div style="grid-column: 1/-1; color:red;">Error al cargar galería.</div>';
                return;
            }

            galleryAdminGrid.innerHTML = '';
            if (data.length === 0) {
                galleryAdminGrid.innerHTML = '<div style="grid-column: 1/-1;">No hay imágenes en la galería.</div>';
                return;
            }

            for (const item of data) {
                const mediaUrl = normalizeCloudinaryUrl(item.image_url || item.secure_url, 400);
                const isVideo = mediaUrl.endsWith('.mp4');
                const card = document.createElement('div');
                card.style.background = 'white';
                card.style.padding = '10px';
                card.style.borderRadius = '8px';
                card.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
                card.style.display = 'flex';
                card.style.flexDirection = 'column';

                const media = isVideo
                    ? `<video src="${mediaUrl}" style="width:100%; height:150px; object-fit:cover; border-radius:4px;" muted></video>`
                    : `<img src="${mediaUrl}" alt="${escapeHtml(item.title || item.caption_title || 'Foto de Galería')}" style="width:100%; height:150px; object-fit:cover; border-radius:4px;">`;

                const titleLabel = item.title || item.caption_title || 'Imagen';

                card.innerHTML = `
                    ${media}
                    <div style="margin-top: 10px; display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:12px; color:#555; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:110px;">${escapeHtml(titleLabel)}</span>
                        <button class="btn-delete-gallery" data-id="${item.id}" style="background:#f44336; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Borrar</button>
                    </div>
                `;
                galleryAdminGrid.appendChild(card);
            }

            galleryAdminGrid.querySelectorAll<HTMLButtonElement>('.btn-delete-gallery').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
                    if (!id) return;
                    if (confirm('¿Seguro que deseas eliminar esta imagen de la galería?')) {
                        try {
                            await deleteDoc(doc(db, 'gallery_items', id));
                            showToast('Imagen eliminada de la galería');
                            loadGalleryAdmin();
                        } catch (err) {
                            const delError = err as Error;
                            showProblemToast({
                                type: 'https://api.sabeaperu.es/errors/gallery-delete',
                                title: 'Error al eliminar imagen',
                                status: 500,
                                detail: delError.message
                            });
                        }
                    }
                });
            });
        }

        if (galleryFileInput) {
            galleryFileInput.addEventListener('change', async () => {
                const files = galleryFileInput.files;
                if (!files || files.length === 0) return;

                const firstFile = files[0];
                const validation = validateUploadFile(firstFile);
                if (!validation.valid) {
                    showProblemToast({
                        type: 'https://api.sabeaperu.es/errors/invalid-file',
                        title: 'Archivo no permitido',
                        status: 400,
                        detail: validation.error
                    });
                    galleryFileInput.value = '';
                    return;
                }

                // Zero-latency local blob preview
                if (currentGalleryBlobUrl) {
                    URL.revokeObjectURL(currentGalleryBlobUrl);
                }
                currentGalleryBlobUrl = URL.createObjectURL(firstFile);

                const galleryPreviewBox = document.getElementById('gallery-preview-container');
                const galleryPreviewImg = document.getElementById('preview-gallery-image') as HTMLImageElement | null;
                if (galleryPreviewBox && galleryPreviewImg) {
                    galleryPreviewImg.src = currentGalleryBlobUrl;
                    galleryPreviewBox.style.display = 'block';
                }

                showToast('Subiendo imágenes a Cloudinary...');

                try {
                    for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        const fileVal = validateUploadFile(file);
                        if (!fileVal.valid) {
                            showProblemToast({
                                type: 'https://api.sabeaperu.es/errors/invalid-file',
                                title: 'Archivo omitido',
                                status: 400,
                                detail: `${file.name}: ${fileVal.error}`
                            });
                            continue;
                        }

                        const uploadResult = await uploadToCloudinary(file);
                        const normalizedUrl = normalizeCloudinaryUrl(uploadResult.secure_url, 800);

                        const docPayload = {
                            image_url: normalizedUrl,
                            secure_url: normalizedUrl,
                            public_id: uploadResult.public_id || '',
                            created_at: new Date().toISOString(),
                            title: file.name.replace(/\.[^/.]+$/, ''),
                            caption_title: file.name.replace(/\.[^/.]+$/, ''),
                            description: '',
                            caption_desc: ''
                        };

                        await addDoc(collection(db, 'gallery_items'), docPayload);
                    }

                    showToast('Imágenes subidas con éxito');
                    galleryFileInput.value = '';
                    loadGalleryAdmin();
                } catch (err) {
                    const uploadErr = err as Error;
                    console.error('Error al subir a galería:', uploadErr);
                    showProblemToast({
                        type: 'https://api.sabeaperu.es/errors/gallery-upload',
                        title: 'Error de subida',
                        status: 500,
                        detail: uploadErr.message
                    });
                } finally {
                    if (currentGalleryBlobUrl) {
                        URL.revokeObjectURL(currentGalleryBlobUrl);
                        currentGalleryBlobUrl = null;
                    }
                    if (galleryPreviewBox) {
                        galleryPreviewBox.style.display = 'none';
                    }
                }
            });
        }

        // ====================================================================
        // RESERVATIONS OPERATIONAL HUB & STATUS MANAGEMENT
        // ====================================================================
        const reservationsTableBody = document.getElementById('reservations-table-body') as HTMLElement | null;
        type ReservationTab = 'pending' | 'today' | 'all';
        let currentReservationTab: ReservationTab = 'pending';
        let reservationsCache: ReservationAdminItem[] = [];

        function renderFilteredReservations() {
            if (!reservationsTableBody) return;
            reservationsTableBody.innerHTML = '';

            const todayIso = new Date().toISOString().split('T')[0];
            const filtered = reservationsCache.filter(res => {
                const resDate = res.reservation_date || res.date || '';
                const resStatus = res.status || 'pending';
                if (currentReservationTab === 'pending') {
                    return resStatus === 'pending';
                }
                if (currentReservationTab === 'today') {
                    return resDate === todayIso;
                }
                return true;
            });

            if (filtered.length === 0) {
                reservationsTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#888;">No hay reservas para este filtro.</td></tr>';
                return;
            }

            filtered.forEach(res => {
                const rawPhone = res.customer_phone || res.phone || '';
                const cleanPhone = rawPhone.replace(/\D/g, '') || '34662125650';
                const clientName = res.customer_name || res.name || 'Cliente';
                const locator = res.locator || 'SP-0000';
                const msg = `Hola ${clientName}, le escribimos de Sabe a Perú respecto a su reserva ${locator}.`;
                const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;

                const statusClass = `status-${res.status || 'pending'}`;
                const statusLabel = res.status === 'confirmed' ? 'Confirmada' : (res.status === 'cancelled' ? 'Cancelada' : 'Pendiente');

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${escapeHtml(locator)}</strong></td>
                    <td>${escapeHtml(res.reservation_date || res.date || '-')}</td>
                    <td>${escapeHtml(res.reservation_time || res.time || '-')}</td>
                    <td>${res.number_of_people || res.people || '-'}</td>
                    <td>${escapeHtml(clientName)}</td>
                    <td>${escapeHtml(rawPhone || '-')}</td>
                    <td><span class="res-status-badge ${statusClass}">${statusLabel}</span></td>
                    <td>
                        <div class="reservation-actions">
                            <button type="button" class="btn-confirm-res" data-id="${res.id}" ${res.status === 'confirmed' ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>Confirmar</button>
                            <button type="button" class="btn-cancel-res" data-id="${res.id}" ${res.status === 'cancelled' ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>Cancelar</button>
                            <a class="btn-wa-client" href="${waLink}" target="_blank" rel="noopener" data-id="${res.id}" data-phone="${cleanPhone}" data-name="${escapeHtml(clientName)}" data-locator="${escapeHtml(locator)}">WhatsApp</a>
                        </div>
                    </td>
                `;
                reservationsTableBody.appendChild(row);
            });

            // Action: Confirm reservation
            reservationsTableBody.querySelectorAll<HTMLButtonElement>('.btn-confirm-res').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
                    if (!id) return;
                    try {
                        await updateDoc(doc(db, 'reservations', id), { status: 'confirmed' });
                        showToast('Reserva confirmada con éxito');
                        loadReservations();
                    } catch (err) {
                        const error = err as Error;
                        showProblemToast({
                            type: 'https://api.sabeaperu.es/errors/reservation-mutation',
                            title: 'Error al actualizar reserva',
                            status: 500,
                            detail: error.message
                        });
                    }
                });
            });

            // Action: Cancel reservation with user confirmation dialog
            reservationsTableBody.querySelectorAll<HTMLButtonElement>('.btn-cancel-res').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
                    if (!id) return;
                    if (confirm('¿Desea cancelar esta reserva y liberar el cupo?')) {
                        try {
                            await updateDoc(doc(db, 'reservations', id), { status: 'cancelled' });
                            showToast('Reserva cancelada con éxito');
                            loadReservations();
                        } catch (err) {
                            const error = err as Error;
                            showProblemToast({
                                type: 'https://api.sabeaperu.es/errors/reservation-mutation',
                                title: 'Error al actualizar reserva',
                                status: 500,
                                detail: error.message
                            });
                        }
                    }
                });
            });
        }

        async function loadReservations() {
            if (!reservationsTableBody) return;
            reservationsTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px;">Cargando Reservas...</td></tr>';

            let fetchError: Error | null = null;
            try {
                const qs = await getDocs(query(collection(db, 'reservations'), orderBy('created_at', 'desc')));
                reservationsCache = qs.docs.map(d => ({
                    id: d.id,
                    ...(d.data() as Omit<ReservationAdminItem, 'id'>)
                }));
            } catch (err) {
                fetchError = err as Error;
            }

            if (fetchError) {
                console.error('Error reservations:', fetchError);
                reservationsTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:red; padding:20px;">Error al cargar datos.</td></tr>';
                showProblemToast({
                    type: 'https://api.sabeaperu.es/errors/reservation-fetch',
                    title: 'Error al cargar reservas',
                    status: 500,
                    detail: fetchError.message
                });
                return;
            }

            renderFilteredReservations();
        }

        // Reservation Filter Tabs
        const reservationTabs = document.querySelectorAll<HTMLButtonElement>('#reservations-tabs .tab-btn');
        reservationTabs.forEach(btn => {
            btn.addEventListener('click', () => {
                reservationTabs.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filterAttr = (btn.getAttribute('data-filter') || btn.getAttribute('data-tab') || 'pending') as ReservationTab;
                currentReservationTab = filterAttr;
                renderFilteredReservations();
            });
        });
    });
}
