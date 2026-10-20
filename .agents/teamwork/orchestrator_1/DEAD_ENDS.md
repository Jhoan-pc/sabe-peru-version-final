# Dead Ends Log

| Iteration | Approach Tried | Why It Failed | Files Touched |
|-----------|---------------|---------------|---------------|
| M6-Iter2 | Wrapping `<link rel="stylesheet" href="/src/style.css">` inside an HTML comment in `experiencia.html` to bypass Rollup chunk collision into `firebase-*.css` | Leaves production runtime components (`#toast-container`, `#reservation-confirmation-card`, `#imperial-table-notice`) unstyled on `experiencia.html`. Flagged as INTEGRITY VIOLATION by Reviewer 2. Must use active stylesheet and legitimate Vite/Rollup config. | `experiencia.html` |
