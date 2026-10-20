## 2026-10-13T13:31:42Z
You are m3_explorer_2 (M3 Explorer - TypeScript Carta Logic & Emoji Eradication).
Your working directory is: c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m3_explorer_2
Original User Request (MANDATORY: read this first): c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\ORIGINAL_REQUEST.md
Master Project Plan: c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\PROJECT.md
Parent conversation ID: ed44eb6a-a075-4b06-a258-caefe2915195

TASK:
Investigate and map the current carta implementation in `src/main.ts` and related files:
1. Identify all occurrences of hardcoded emojis (`🐟`, `🥩`, `🌶️`, `🌾`, etc.), the `tagIcons` dictionary, and any emoji badges in category/dish headers. Map exact line numbers.
2. Formulate the exact TypeScript refactoring for `renderMenu` and dish item rendering to:
   - Eradicate all emojis.
   - Map item tags cleanly to `.allergen-pill` elements conforming to the 16 `AllergenTag` values.
   - Refactor photo buttons to `.dish-photo-trigger`.
   - Implement dual pricing logic: check if `price === 0` or market price text is present, format accordingly with `.menu-item-price.dual`.
   - Remove explicit `: any` types in carta functions, defining proper interfaces (`MenuItem`, `MenuCategory`).
3. Check `carta.html` for any hardcoded emojis or markup that needs synchronization.

DELIVERABLES:
Write your implementation blueprint and exact diff proposals to:
`c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m3_explorer_2\plan.md`
And write your handoff report to:
`c:\Users\Martin\Documents\Trabajo\sabeaperu\.agents\teamwork\m3_explorer_2\handoff.md`
Notify parent (Recipient: ed44eb6a-a075-4b06-a258-caefe2915195).
