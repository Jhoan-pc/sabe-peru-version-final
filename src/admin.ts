
import { createClient } from '@supabase/supabase-js';

// Configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials missing!');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

let currentMode = 'create'; // or 'edit'
let currentItemId: string | null = null;

// --- UTILS ---
function showToast(message: string, type: 'success' | 'error' = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function setLoading(button: HTMLButtonElement, isLoading: boolean, text: string) {
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalHtml = button.innerHTML;
        button.innerHTML = `<span class="spinner"></span> ${text}...`;
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalHtml || button.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // --- AUTHENTICATION ---
    const loginScreen = document.getElementById('login-screen') as HTMLElement;
    const dashboardScreen = document.getElementById('dashboard-screen') as HTMLElement;
    const loginForm = document.getElementById('login-form') as HTMLFormElement;
    const loginMessage = document.getElementById('login-message') as HTMLElement;
    const logoutBtn = document.getElementById('logout-btn') as HTMLButtonElement;

    // Check session
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        showDashboard();
    } else {
        loginScreen.style.display = 'flex';
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = (document.getElementById('login-email') as HTMLInputElement).value;
        const password = (document.getElementById('login-password') as HTMLInputElement).value;
        const submitBtn = loginForm.querySelector('button') as HTMLButtonElement;

        setLoading(submitBtn, true, 'Verificando');

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        setLoading(submitBtn, false, 'Ingresar');

        if (error) {
            loginMessage.textContent = 'Error: ' + error.message;
            showToast('Credenciales incorrectas', 'error');
        } else {
            showToast('Bienvenido, Administrador');
            showDashboard();
        }
    });

    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.reload();
    });

    function showDashboard() {
        loginScreen.style.display = 'none';
        dashboardScreen.style.display = 'block';
        loadMenu();
    }

    // --- NAVIGATION ---
    const navBtns = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.dashboard-view');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            // Update buttons
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update views
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

    let allMenuItems: any[] = [];

    async function loadMenu() {
        menuTableBody.innerHTML = '<tr><td colspan="5">Cargando...</td></tr>';

        const { data, error } = await supabase
            .from('menu_items')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading menu:', error);
            menuTableBody.innerHTML = '<tr><td colspan="5">Error al cargar datos. Contáctese con soporte.</td></tr>';
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
            const query = searchInput.value.toLowerCase();
            filtered = filtered.filter(item =>
                (item.name || '').toLowerCase().includes(query) ||
                (item.description || '').toLowerCase().includes(query) ||
                (item.subcategory || '').toLowerCase().includes(query)
            );
        }

        renderMenuTable(filtered);
    }

    if (searchInput) searchInput.addEventListener('input', filterAndRenderMenu);
    if (filterCategory) filterCategory.addEventListener('change', filterAndRenderMenu);

    function renderMenuTable(items: any[]) {
        menuTableBody.innerHTML = '';
        items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${item.name}</strong><br><small>${item.subcategory || ''}</small></td>
                <td>${item.category}</td>
                <td>S/. ${item.price}</td>
                <td>${item.is_available ? '<span style="color:green">Disponible</span>' : '<span style="color:red">No Disp.</span>'}</td>
                <td>
                    <button class="btn-edit" data-id="${item.id}">Editar</button>
                    <button class="btn-delete" data-id="${item.id}">Borrar</button>
                </td>
            `;
            menuTableBody.appendChild(row);
        });

        // Add event listeners for dynamic buttons
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

    // Modal Logic
    addItemBtn.addEventListener('click', () => {
        openCreateModal();
    });

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    function openCreateModal() {
        currentMode = 'create';
        currentItemId = null;
        itemForm.reset();
        document.getElementById('modal-title')!.textContent = 'Agregar Nuevo Plato';
        const uploadStatus = document.getElementById('upload-status');
        if (uploadStatus) {
            uploadStatus.textContent = 'Deja vacío si no tiene foto.';
            uploadStatus.style.color = 'inherit';
        }
        modal.style.display = 'block';
    }

    // Handle Item Image Upload
    const itemImageFile = document.getElementById('item-image-file') as HTMLInputElement;
    const itemImageUrl = document.getElementById('item-image-url') as HTMLInputElement;
    const uploadStatus = document.getElementById('upload-status') as HTMLElement;

    if (itemImageFile) {
        itemImageFile.addEventListener('change', async () => {
            if (!itemImageFile.files || itemImageFile.files.length === 0) return;

            const file = itemImageFile.files[0];
            uploadStatus.textContent = 'Subiendo imagen...';
            uploadStatus.style.color = 'var(--color-gold)';

            const fileExt = file.name.split('.').pop();
            const fileName = `menu_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('restaurante-assets')
                .upload(fileName, file);

            if (uploadError) {
                console.error("Error al subir:", uploadError);
                uploadStatus.textContent = 'Error al subir la imagen.';
                uploadStatus.style.color = 'red';
                showToast('Error al subir la imagen', 'error');
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('restaurante-assets')
                .getPublicUrl(fileName);

            itemImageUrl.value = publicUrl;
            uploadStatus.textContent = '✅ Imagen lista para guardar.';
            uploadStatus.style.color = 'green';
            showToast('Imagen subida correctamente');
        });
    }

    function openEditModal(id: string | null, item: any) {
        if (!item) {
            console.error("No se encontró el item con ID:", id);
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

            let tagsVal = '';
            if (Array.isArray(item.tags)) {
                tagsVal = item.tags.join(', ');
            } else if (typeof item.tags === 'string') {
                tagsVal = item.tags;
            }
            (document.getElementById('item-tags') as HTMLInputElement).value = tagsVal;

            (document.getElementById('item-available') as HTMLInputElement).checked = !!item.is_available;
            (document.getElementById('item-image-url') as HTMLInputElement).value = item.image_url || '';

            document.getElementById('modal-title')!.textContent = 'Editar Plato';
            modal.style.display = 'block';
        } catch (err) {
            console.error("Error validando el plato:", err);
            showToast("Error al abrir la configuración: " + (err as Error).message, 'error');
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
        const sort_order = orderStr ? parseInt(orderStr) : 0;

        const tagsInput = (document.getElementById('item-tags') as HTMLInputElement).value;
        const is_available = (document.getElementById('item-available') as HTMLInputElement).checked;

        const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);

        const image_url = (document.getElementById('item-image-url') as HTMLInputElement).value;

        const itemData = {
            name, description, price, category, subcategory, sort_order, tags, is_available, image_url
        };

        setLoading(submitBtn, true, 'Guardando');

        let error;
        if (currentMode === 'create') {
            const { error: insertError } = await supabase.from('menu_items').insert([itemData]);
            error = insertError;
        } else {
            const { error: updateError } = await supabase.from('menu_items').update(itemData).eq('id', currentItemId);
            error = updateError;
        }

        setLoading(submitBtn, false, 'Guardar');

        if (error) {
            showToast('Error al guardar: ' + error.message, 'error');
        } else {
            showToast(currentMode === 'create' ? 'Plato creado con éxito' : 'Plato actualizado');
            modal.style.display = 'none';
            loadMenu();
        }
    });

    async function deleteItem(id: string | null) {
        if (!id) return;
        const { error } = await supabase.from('menu_items').delete().eq('id', id);
        if (error) {
            showToast('Error al borrar: ' + error.message, 'error');
        } else {
            showToast('Plato eliminado');
            loadMenu();
        }
    }

    // --- HOME PAGE CONTENT ---
    const homeForm = document.getElementById('home-content-form') as HTMLFormElement;

    async function loadHomePageContent(skipInputs = false) {
        const { data, error } = await supabase.from('site_content').select('*');
        if (error) {
            showToast('Error cargando contenido: ' + error.message, 'error');
            return;
        }

        // Fill inputs and previews based on data-key
        data.forEach(item => {
            if (item.type === 'image') {
                const previewImg = document.getElementById(`preview-${item.key.replace(/_/g, '-')}`) as HTMLImageElement;
                if (previewImg) {
                    previewImg.src = item.content;
                    previewImg.style.display = 'block';
                }
            } else if (!skipInputs) {
                const input = homeForm.querySelector(`[data-key="${item.key}"]`) as HTMLInputElement | HTMLTextAreaElement;
                if (input) input.value = item.content;
            }
        });
    }

    // --- UNIVERSAL SECTION SAVE ---
    async function saveSectionContent(section: HTMLElement, button: HTMLButtonElement) {
        const inputs = section.querySelectorAll('[data-key]');
        const imageInputs = section.querySelectorAll('input[type="file"][data-image-key]') as NodeListOf<HTMLInputElement>;

        setLoading(button, true, 'Guardando');

        try {
            // 1. Text Content Updates - BATCH UPSERT
            const textUpdates = Array.from(inputs).map(input => ({
                key: input.getAttribute('data-key'),
                content: (input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value,
                updated_at: new Date()
            })).filter(update => update.key); // Ensure key exists

            if (textUpdates.length > 0) {
                const { error: textError } = await supabase.from('site_content').upsert(textUpdates, { onConflict: 'key' });
                if (textError) throw textError;
            }

            // 2. Image Updates
            for (const input of Array.from(imageInputs)) {
                if (input.files && input.files.length > 0) {
                    const file = input.files[0];
                    const key = input.getAttribute('data-image-key');

                    if (file.size > 20 * 1024 * 1024) {
                        showToast(`La imagen "${key}" es demasiado grande.`, 'error');
                        continue;
                    }

                    const fileExt = file.name.split('.').pop();
                    const fileName = `content_${key}_${Date.now()}.${fileExt}`;

                    const { error: uploadError } = await supabase.storage
                        .from('restaurante-assets')
                        .upload(fileName, file, { upsert: true });

                    if (uploadError) throw uploadError;

                    const { data } = supabase.storage.from('restaurante-assets').getPublicUrl(fileName);

                    const { error: imgUpsertError } = await supabase.from('site_content').upsert({
                        key: key,
                        content: data.publicUrl + '?v=' + Date.now(),
                        type: 'image',
                        updated_at: new Date()
                    }, { onConflict: 'key' });

                    if (imgUpsertError) throw imgUpsertError;
                    input.value = ''; // Reset file input
                }
            }

            showToast('Sección actualizada con éxito');
            // Reload previews WITHOUT overwriting other inputs the user might be editing
            if (section.closest('#home-view')) loadHomePageContent(true);
            if (section.closest('#experiencia-view')) loadExperienciaContent(true);

        } catch (err: any) {
            console.error("Error saving section:", err);
            showToast('Error: ' + (err.message || 'Error desconocido'), 'error');
        } finally {
            setLoading(button, false, 'Guardar Sección');
        }
    }

    // Attach listeners to "Guardar Sección" buttons
    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('btn-save-section')) {
            const section = target.closest('.content-group') as HTMLElement;
            if (section) {
                saveSectionContent(section, target as HTMLButtonElement);
            }
        }
    });

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

    // --- EXPERIENCIA PAGE CONTENT ---
    const experienciaForm = document.getElementById('experiencia-content-form') as HTMLFormElement;

    async function loadExperienciaContent(skipInputs = false) {
        const { data, error } = await supabase.from('site_content').select('*').like('key', 'exp_%');
        if (error) {
            showToast('Error cargando contenido: ' + error.message, 'error');
            return;
        }

        // Fill inputs and previews based on data-key
        data.forEach(item => {
            if (item.type === 'image') {
                const previewImg = document.getElementById(`preview-${item.key.replace(/_/g, '-')}`) as HTMLImageElement;
                if (previewImg) {
                    previewImg.src = item.content;
                    previewImg.style.display = 'block';
                }
            } else if (!skipInputs) {
                const input = experienciaForm.querySelector(`[data-key="${item.key}"]`) as HTMLInputElement | HTMLTextAreaElement;
                if (input) input.value = item.content;
            }
        });
    }

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


    // --- GALLERY MANAGEMENT ---
    const galleryAdminGrid = document.getElementById('gallery-admin-grid');
    const galleryUploadInput = document.getElementById('gallery-upload-input') as HTMLInputElement;

    async function loadGalleryAdmin() {
        if (!galleryAdminGrid) return;
        (galleryAdminGrid as HTMLElement).innerHTML = '<div style="grid-column: 1/-1;">Cargando Galería...</div>';

        const { data, error } = await supabase.storage.from('restaurante-assets').list();
        if (error || !data) {
            showToast('Error al cargar galería', 'error');
            return;
        }

        const galleryFiles = data
            .filter((file: any) => file.name.toLowerCase().startsWith('galeria') && !file.name.toLowerCase().includes('galeria2'))
            .sort((a: any, b: any) => {
                const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
                const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');
                return numA - numB;
            });

        if (galleryAdminGrid) {
            (galleryAdminGrid as HTMLElement).innerHTML = '';

            if (galleryFiles.length === 0) {
                (galleryAdminGrid as HTMLElement).innerHTML = '<div style="grid-column: 1/-1;">No hay imágenes en la galería.</div>';
                return;
            }
        }

        galleryFiles.forEach((file: any) => {
            const fileUrl = supabase.storage.from('restaurante-assets').getPublicUrl(file.name).data.publicUrl;
            const isVideo = file.metadata?.mimetype?.startsWith('video') || file.name.endsWith('.mp4');

            const card = document.createElement('div');
            card.style.background = 'white';
            card.style.padding = '10px';
            card.style.borderRadius = '8px';
            card.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';

            const media = isVideo
                ? `<video src="${fileUrl}" style="width:100%; height:150px; object-fit:cover; border-radius:4px;" muted></video>`
                : `<img src="${fileUrl}" style="width:100%; height:150px; object-fit:cover; border-radius:4px;">`;

            card.innerHTML = `
                ${media}
                <div style="margin-top: 10px; text-align:right;">
                    <button class="btn-delete-gallery" data-filename="${file.name}" style="background:#f44336; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Borrar</button>
                </div>
            `;
            if (galleryAdminGrid) {
                galleryAdminGrid.appendChild(card);
            }
        });

        document.querySelectorAll('.btn-delete-gallery').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const fileName = (e.currentTarget as HTMLElement).getAttribute('data-filename');
                if (confirm(`¿Seguro que quieres borrar ${fileName}?`)) {
                    if (fileName) {
                        const { error } = await supabase.storage.from('restaurante-assets').remove([fileName]);
                        if (error) {
                            showToast('Error al borrar', 'error');
                        } else {
                            showToast('Imagen borrada');
                            loadGalleryAdmin();
                        }
                    }
                }
            });
        });
    }

    if (galleryUploadInput) {
        galleryUploadInput.addEventListener('change', async () => {
            const files = galleryUploadInput.files;
            if (!files || files.length === 0) return;

            showToast('Subiendo imágenes...');

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `galeria_admin_${Date.now()}_${i}.${fileExt}`;

                await supabase.storage.from('restaurante-assets').upload(fileName, file);
            }

            showToast('Imágenes subidas con éxito');
            galleryUploadInput.value = '';
            loadGalleryAdmin();
        });
    }


    // --- RESERVATIONS ---
    const reservationsTableBody = document.getElementById('reservations-table-body') as HTMLElement;

    async function loadReservations() {
        reservationsTableBody.innerHTML = '<tr><td colspan="6">Cargando...</td></tr>';

        const { data, error } = await supabase
            .from('reservations')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error reservations:', error);
            reservationsTableBody.innerHTML = '<tr><td colspan="6">Error al cargar datos.</td></tr>';
            return;
        }

        reservationsTableBody.innerHTML = '';
        (data || []).forEach((res: any) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${res.reservation_date}</td>
                <td>${res.reservation_time || '-'}</td>
                <td>${res.customer_name}</td>
                <td>${res.number_of_people}</td>
                <td>${res.customer_email}</td>
                <td>${res.occasion || '-'}</td>
            `;
            reservationsTableBody.appendChild(row);
        });
    }

});
