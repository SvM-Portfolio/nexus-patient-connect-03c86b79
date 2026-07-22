## Goal
Apply the selected "Midnight Professional" theme to Nexus Pro. The app should keep its current top-header AppShell and existing dashboard layouts, but adopt the direction's palette, surfaces, and accent colors.

## What will change

### 1. Design tokens in `src/styles.css`
- Background: shift from pure white to a soft slate-50/100 wash.
- Primary: change from blue to emerald (clinical, authoritative green).
- Cards/surfaces: replace heavy glassmorphism with clean white cards on subtle slate borders.
- Foreground: use a deeper slate-900 for headings and slate-500 for secondary text.
- Dark mode: adapt the existing dark variables to align with the new emerald accent.
- Clinical domain accents: recolor so they harmonize with emerald rather than the current pastel rainbow.

### 2. Glassmorphism tuning
- Reduce reliance on translucent blur.
- Keep a light frosted header but make it crisp white/slate instead of the current pale glass.
- Update the `glass-surface` utility to match the new surface treatment.

### 3. Components that need token updates
- `src/components/AppShell.tsx` — header background, borders, logo accent, nav text colors.
- `src/components/GlassCard.tsx` — card background, border, accent strip colors.
- `src/components/ThemeToggle.tsx` — no logic change, but button styling may need token tweaks.
- Dashboard panels under `src/components/dashboard/physician/*` and `src/components/dashboard/front-office/*` — refresh text, badge, and icon colors to use the new tokens.
- Patient directory and patient detail routes — update card and table styling to match.

### 4. Global background & ambient wash
- Replace the current blue-tinted radial glow with a neutral-to-slate ambient wash that pairs with the emerald primary.

### 5. Verification
- Run `tsgo --noEmit` to confirm no type regressions.
- Spot-check the preview on `/dashboard/physician` and `/patients` to confirm the theme is applied consistently.

## What will NOT change
- The AppShell top-header layout (global search, popovers, profile menu, breadcrumbs).
- The Physician and Front Office dashboard layouts and panel order.
- The patient-directory and patient-detail page structures.
- Routing, FHIR proxy, and role-based redirects.

## Why preserve the layout
The prototypes were color-theme explorations. Rebuilding the entire app into a sidebar layout would replace the existing EHR command center and require re-implementing navigation, search, and role switching. Applying the selected palette to the current architecture gives the requested visual enhancement without losing the established functionality.