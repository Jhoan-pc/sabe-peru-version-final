## 2026-10-14T08:11:44Z
You are m4_explorer_2 (M4 Explorer - Admin Codebase & DOM Architecture).
Your working directory is: c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m4_explorer_2
Original User Request (MANDATORY: read this first): c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\ORIGINAL_REQUEST.md
Master Project Plan: c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\PROJECT.md
Parent conversation ID: ed44eb6a-a075-4b06-a258-caefe2915195

Relevant domain skill:
c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\skills\especialista-admin-backoffice\SKILL.md

TASK:
Investigate and map the current backoffice implementation in `src/admin.ts`, `admin.html`, and `src/main.ts` (gallery consumer):
1. In `src/admin.ts`:
   - Map all Firebase Storage imports and calls (`ref`, `uploadBytes`, `getDownloadURL`, `deleteObject`, `listAll`) and formulate their complete replacement using Firestore `gallery_items` and Cloudinary.
   - Map lines where `: any` is used, and define TypeScript interfaces (`DishItem`, `GalleryItem`, `ReservationAdminItem`, `DishFormElements`, etc.).
   - Design the exact TypeScript implementation of `export function normalizeCloudinaryUrl(url: string, width = 800): string`.
   - Design the interactive chips toggle logic, live file preview logic with 10 MB validation, reservation action buttons handlers, and filter tabs logic.
2. In `admin.html`:
   - Map lines for `#item-tags` (free-text input) and design the 16-chip container markup.
   - Map lines for image preview containers (`#dish-preview-container`, `#gallery-preview-container`).
   - Map lines for the reservations table and header tabs (`#reservations-tabs`, `#tab-pending`, `#tab-today`, `#tab-all`).
   - Verify styling conforms to Quiet Luxury tokens (`--lux-*`).
3. In `src/main.ts`:
   - Inspect `loadGallery()` (lines 528–610). Show how to migrate it from Firebase Storage to Firestore `gallery_items` with `normalizeCloudinaryUrl(item.image_url, 600)`.
   - Eradicate remaining `: any` types in `src/main.ts:542, 567, 568, 602`.

DELIVERABLES:
Write your implementation blueprint and exact diff proposals to:
`c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m4_explorer_2\plan.md`
And write your handoff report to:
`c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m4_explorer_2\handoff.md`
Notify parent (Recipient: ed44eb6a-a075-4b06-a258-caefe2915195).
