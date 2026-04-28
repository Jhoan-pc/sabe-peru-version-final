import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
export interface ReservationSlot {
    time: string;
    available: boolean;
    reason?: string;
}

const KITCHEN_HOURS: Record<number, { open: string, last: string }> = {
    0: { open: '12:00', last: '21:30' }, // Domingo
    1: { open: '12:00', last: '23:30' }, // Lunes
    2: { open: '12:00', last: '23:30' }, // Martes
    3: { open: '12:00', last: '23:30' }, // Miércoles
    4: { open: '12:00', last: '23:30' }, // Jueves
    5: { open: '12:00', last: '23:30' }, // Viernes
    6: { open: '12:00', last: '22:30' }  // Sábado
};

export async function getAvailableSlots(dateStr: string): Promise<ReservationSlot[]> {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    const hours = KITCHEN_HOURS[dayOfWeek];

    if (!hours) return [];

    // Generate all 30min slots
    const allSlots: string[] = [];
    let current = hours.open;
    
    while (current <= hours.last) {
        allSlots.push(current);
        const [h, m] = current.split(':').map(Number);
        const nextM = m + 30;
        const nextH = h + Math.floor(nextM / 60);
        const nextMFinal = nextM % 60;
        current = `${String(nextH).padStart(2, '0')}:${String(nextMFinal).padStart(2, '0')}`;
    }

    // Fetch existing reservations for this date
    try {
        const q = query(
            collection(db, 'reservations'),
            where('reservation_date', '==', dateStr),
            where('status', '!=', 'cancelled')
        );
        const qs = await getDocs(q);

        // Count reservations per slot
        const counts: Record<string, number> = {};
        qs.docs.forEach(docSnap => {
            const r = docSnap.data();
            if (r.reservation_time) {
                const time = r.reservation_time.substring(0, 5); // Ensure HH:MM format
                counts[time] = (counts[time] || 0) + 1;
            }
        });

        // Map to slots with availability
        return allSlots.map(time => ({
            time,
            available: (counts[time] || 0) < 4,
            reason: (counts[time] || 0) >= 4 ? 'Completo' : undefined
        }));

    } catch (err) {
        console.error("Error fetching availability:", err);
        // Fallback: return slots as available if DB fails
        return allSlots.map(time => ({ time, available: true }));
    }
}

export function initReservationUI(formId: string, containerId: string) {
    const form = document.getElementById(formId) as HTMLFormElement;
    const container = document.getElementById(containerId);
    const dateInput = form?.querySelector('input[name="date"]') as HTMLInputElement;

    if (!form || !container || !dateInput) return;

    // Set min date to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;

    dateInput.addEventListener('change', async () => {
        const selectedDate = dateInput.value;
        if (!selectedDate) return;

        container.innerHTML = '<div class="loading-slots">Consultando disponibilidad...</div>';
        
        const slots = await getAvailableSlots(selectedDate);
        renderSlots(slots);
    });

    function renderSlots(slots: ReservationSlot[]) {
        container!.innerHTML = '';
        
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.gap = '5px';
        wrapper.style.width = '100%';

        const label = document.createElement('label');
        label.className = 'slot-label-small';
        label.textContent = 'Hora disponible *';
        wrapper.appendChild(label);

        const select = document.createElement('select');
        select.name = 'time'; // Primary time input
        select.required = true;
        select.className = 'slot-select-menu';

        // Initial placeholder option
        const placeholder = document.createElement('option');
        placeholder.value = "";
        placeholder.textContent = slots.length === 0 ? "Sin disponibilidad" : "Seleccione hora...";
        placeholder.disabled = true;
        placeholder.selected = true;
        select.appendChild(placeholder);

        slots.forEach(slot => {
            const opt = document.createElement('option');
            opt.value = slot.time;
            opt.textContent = `${slot.time}${slot.available ? '' : ' (Lleno)'}`;
            opt.disabled = !slot.available;
            select.appendChild(opt);
        });

        wrapper.appendChild(select);
        container!.appendChild(wrapper);
    }
}
