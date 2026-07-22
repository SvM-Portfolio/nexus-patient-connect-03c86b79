
## Scope

Turn Nexus Pro into a role-based EHR shell with a persistent global header and two role dashboards (Physician + Front Office). All data comes from the existing `/api/fhir/*` proxy — no mocks. Existing patient chart at `/patients/$id` and intake at `/patients/new` are preserved.

## Architecture

New route tree:

```text
/                          → redirects to active role dashboard
/dashboard/physician       → Physician command center (default)
/dashboard/front-office    → Front Office operations
/patients                  → existing patient directory (moved from /)
/patients/$id              → existing chart
/patients/new              → existing intake
```

Role state (initial release): stored in `localStorage` under `nexus.activeRole`, with a role switcher in the header profile menu. Auth is not yet wired, so "role" is a client-side selection — architected as a hook (`useActiveRole`) so it can be swapped for a real claim later without touching panels.

## Global Header (persistent shell)

New `src/components/AppShell.tsx` wraps every non-auth route via a pathless layout `src/routes/_app.tsx`. The existing `/`, `/patients/*` routes move under it. Header contents:

- **Left**: Nexus Pro logo, Home button (routes to active role dashboard), breadcrumb from `useMatches()`.
- **Center**: Global search (`GlobalSearch.tsx`) — debounced, activates at 2 chars, queries `Patient?name=`, `Patient?identifier=` (MRN), `Practitioner?name=`, `Organization?name=`, `Medication?code:text=`, `ServiceRequest?code:text=`, `Procedure?code:text=` in parallel. Results grouped by type in a floating glass popover.
- **Right**: Notifications, Messages, **Calendar popover**, Theme switcher (existing), Profile menu with role switcher.

Icons: lucide outlined, glass hover states matching existing tokens.

## Calendar Popover

`src/components/CalendarPopover.tsx` — Radix Popover, glass surface, never navigates. Three sections:

1. **Upcoming Appointments** — `Appointment?date=geYYYY-MM-DD&_sort=date&_count=10`, showing time, patient (resolve `subject`), type, provider (`participant`), status badge.
2. **Upcoming Events** — `Schedule?_count=10` filtered by `serviceType` for office events / meetings / holidays / time-off / training / maintenance. Grouped list.
3. **Quick Actions** — Schedule, Accept Request, Reschedule, Cancel, View Full Calendar (routes to future `/calendar`).

Appointment mutations open slide-over drawers reusing existing shadcn `Sheet`.

## Physician Dashboard (`/dashboard/physician`)

Responsive 3-col grid of floating glass cards. Each panel is an independent component with its own `useQuery` — refetch/error isolation per panel, skeletons on load.

Panels (each = one file in `src/components/dashboard/physician/`):

1. **TodaysSummary** — 3 KPI cards. `Appointment?date=eqTODAY&practitioner=me` grouped by status: `booked` → scheduled, `noshow` → no-show (amber), `fulfilled` → seen (emerald). Animated count using `useSpring`-style CSS transitions.
2. **Messages** — categories from `Communication?recipient=me` + `CommunicationRequest?recipient=me` bucketed by `category`. Rows show category, count, unread dot. "Create Message" opens `NewMessageDrawer` (Sheet) that POSTs a `Communication`.
3. **LaboratoryOrders** — `DiagnosticReport?performer=me&_count=100` bucketed: total received, normal/abnormal × reviewed/unreviewed (using `conclusionCode` + `extension` for reviewed flag). Clicking a bucket routes to `/patients` prefiltered (future lab queue).
4. **TodaysSchedule** — same appointment query, chronological list. Row actions: Check In (`Appointment.status = arrived`), Start Encounter (POST `Encounter`), Reschedule (Sheet), Cancel (`status = cancelled`).
5. **RecentPatients** — pulled from `localStorage` MRU list updated whenever `/patients/$id` mounts (add small effect in existing chart). Row: name, age, gender, last visit (`Encounter?subject=X&_sort=-date&_count=1`), primary Dx, Open Chart link.
6. **ClinicalAlerts** — union of: critical labs (`DiagnosticReport?performer=me&conclusion=critical`), drug allergy intolerances (`AllergyIntolerance?asserter=me&criticality=high`), unreviewed results, outstanding `ServiceRequest?status=active`, preventive care reminders (`CarePlan?performer=me`), recent admissions (`Encounter?participant=me&class=IMP&_sort=-date`). Pastel amber/rose accents.
7. **QuickActions** — 9 buttons opening existing/new drawers: New Patient (link to `/patients/new`), Search Patient (focuses global search), Order Lab / Imaging / Procedure / Prescribe / Note (reuse existing `QuickActions.tsx` drawers, generalized to work without a patient — first step picks patient), Telephone Encounter (POST `Encounter class=VR`), Referral (POST `ServiceRequest intent=order`).

Additional smaller cards: **PendingTasks** (`Task?owner=me&status=requested`), **Announcements** (static config for now, wired to `Basic` resource later).

## Front Office Dashboard (`/dashboard/front-office`)

Same shell, different panels in `src/components/dashboard/front-office/`:

- **PatientFlow** KPIs: scheduled today, checked-in, in-room, checked-out, no-show.
- **CheckInQueue** — `Appointment?date=eqTODAY&status=booked,arrived`; row actions Check-In, Check-Out (POST `Encounter` status transitions).
- **RegistrationQuickAdd** — link to intake wizard, plus recent registrations (`Patient?_sort=-_lastUpdated&_count=5`).
- **AppointmentScheduler** — mini day/week view with slot creation (POST `Appointment`).
- **AppointmentConfirmations** — list `booked` appointments ≤48h out with "Confirm" (`extension` flag) / "Reschedule" / "Cancel" actions.
- **InsuranceVerification** — `Coverage?_sort=-_lastUpdated&status=active` needing verification; opens verification drawer.
- **WaitingRoom** — `Appointment?status=arrived` + estimated wait.
- **FrontOfficeMessages** — same messages panel scoped to front-office categories.
- **DailyOps** — combined announcements + shift notes.

## Design System

Extend `src/styles.css` with glass tokens:

```css
--glass-bg, --glass-border, --glass-shadow, --glass-blur
```

Panel primitive `src/components/GlassCard.tsx` — translucent bg, `backdrop-blur-xl`, rounded-2xl, thin border, soft shadow, generous padding. Pastel accents mapped to existing clinical domain colors from previous turn.

## Data Layer

Extend `src/lib/fhir.ts` with thin typed helpers per resource used (Appointment, Communication, DiagnosticReport, Task, Encounter, Coverage, Schedule, Practitioner, Organization, Medication, ServiceRequest, Procedure). All go through `/api/fhir/*` — the existing proxy adds bearer token server-side.

Common utilities:
- `searchFhir<T>(resourceType, params)` generic wrapper (already partially exists).
- `useTodaysAppointments`, `useUnreadMessages`, `useLabBuckets`, `useClinicalAlerts` hooks in `src/hooks/`.

React Query defaults per panel: `staleTime: 30_000`, `refetchOnWindowFocus: true`, retry on network error with exponential backoff.

## Not in this pass (called out to user)

- Real auth / role from JWT claim (using local role switcher for now).
- Drag-and-drop panel customization.
- Full `/calendar` page — popover only.
- Nurse / MA / Billing / Care Coordinator / Admin dashboards (architecture supports adding them later — each is a route under `/dashboard/{role}` with its own panels folder).

## Delivery order

1. Design tokens + `GlassCard` + `AppShell` + pathless `_app` layout; move existing routes under it; add role hook + redirect at `/`.
2. Global header with search, theme, profile/role switcher.
3. Calendar popover + Messages/Notifications popovers.
4. Physician dashboard panels 1–4, then 5–7 + pending tasks/announcements.
5. Front Office dashboard panels.
6. Wire Recent Patients MRU into existing `/patients/$id`.
7. Typecheck + visual verification.
