---
name: meroshare-design
description: >
  Complete design system, visual language, and UI/UX specification for the MeroShare
  IPO web application. Use this skill alongside meroshare-webapp whenever building,
  styling, or modifying any UI component, page layout, color, typography, animation,
  or interaction in this project. Always read this before writing any JSX, CSS, or
  Tailwind classes. Never freestyle the design — follow this spec.
---

# MeroShare IPO App — Design System

## Design Philosophy

**Tone**: Financial-grade clarity with Nepali warmth. Not a cold Bloomberg terminal.
Not a cheerful fintech toy. Somewhere between: a well-organised CA's desk and
a modern Kathmandu startup's dashboard. Trustworthy, readable, calm under pressure.

**One thing to remember**: Every family member's money is on the line during apply.
The UI must communicate status — success, failure, in-progress — with zero ambiguity.
No decorative ambiguity. If something failed, it looks like it failed.

**Aesthetic direction**: Dark-first. Deep navy base. Warm saffron accent (Nepal flag
reference). Clean sans-serif type. Subtle depth via layered card surfaces.
Data-dense but not cramped. Think: Vercel dashboard meets a NEPSE trading terminal.

---

## Color System

Define as CSS variables in `index.css` and Tailwind config:

```css
:root {
  /* Base surfaces */
  --bg-base:        #0B0F1A;   /* deepest background */
  --bg-surface:     #111827;   /* card / panel surface */
  --bg-elevated:    #1C2333;   /* elevated card, modal */
  --bg-hover:       #243044;   /* hover state */

  /* Primary accent — saffron/gold (Nepal flag inspired) */
  --accent-primary:   #F5A623;   /* main CTA, active state */
  --accent-secondary: #E8930C;   /* hover on primary */
  --accent-muted:     #F5A62320; /* background tint for highlights */

  /* Status colors */
  --status-success:   #22C55E;   /* allotted, applied OK */
  --status-warning:   #F59E0B;   /* closing soon, pending */
  --status-error:     #EF4444;   /* failed, login error */
  --status-info:      #3B82F6;   /* dry run, informational */
  --status-neutral:   #6B7280;   /* not allotted, skipped */

  /* Text */
  --text-primary:   #F3F4F6;   /* headings, important labels */
  --text-secondary: #9CA3AF;   /* supporting text */
  --text-muted:     #4B5563;   /* placeholders, disabled */
  --text-accent:    #F5A623;   /* accent text links */

  /* Borders */
  --border-subtle:  #1F2937;   /* card borders */
  --border-default: #374151;   /* input borders, dividers */
  --border-focus:   #F5A623;   /* focused input ring */
}
```

### Light Mode (optional toggle — Phase 4)
```css
[data-theme="light"] {
  --bg-base:      #F8FAFC;
  --bg-surface:   #FFFFFF;
  --bg-elevated:  #F1F5F9;
  --bg-hover:     #E2E8F0;
  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-muted:   #94A3B8;
  --border-subtle:  #E2E8F0;
  --border-default: #CBD5E1;
  /* accent and status colors stay the same */
}
```

### Tailwind Config Extension
```js
// tailwind.config.js
colors: {
  base:      'var(--bg-base)',
  surface:   'var(--bg-surface)',
  elevated:  'var(--bg-elevated)',
  accent:    'var(--accent-primary)',
  'accent-secondary': 'var(--accent-secondary)',
  success:   'var(--status-success)',
  warning:   'var(--status-warning)',
  error:     'var(--status-error)',
  info:      'var(--status-info)',
  neutral:   'var(--status-neutral)',
  primary:   'var(--text-primary)',
  secondary: 'var(--text-secondary)',
  muted:     'var(--text-muted)',
}
```

---

## Typography

```css
/* Import in index.html */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
```

| Role | Font | Weight | Size |
|---|---|---|---|
| App name / logo | DM Sans | 600 | 20px |
| Page headings (h1) | DM Sans | 600 | 24px |
| Section headings (h2) | DM Sans | 500 | 18px |
| Card titles | DM Sans | 500 | 14px |
| Body text | DM Sans | 400 | 14px |
| Supporting / labels | DM Sans | 400 | 12px |
| Numbers / data | JetBrains Mono | 500 | 13px |
| Status badges | DM Sans | 500 | 11px |

**Rule**: All rupee amounts, kitta counts, dates, and IDs use `JetBrains Mono`.
Everything else uses `DM Sans`. Never mix more than two fonts.

---

## Spacing & Layout

**Base unit**: 4px (`spacing-1` in Tailwind)

| Token | Value | Use |
|---|---|---|
| xs | 4px | Icon gap, tight label padding |
| sm | 8px | Input padding vertical |
| md | 12px | Card padding, row gap |
| lg | 16px | Section gap |
| xl | 24px | Page section gap |
| 2xl | 32px | Major section separation |
| 3xl | 48px | Page top padding |

**Page layout**:
```
┌─────────────────────────────────────────────────┐
│  Sidebar (240px fixed)  │  Main content area     │
│                         │  max-width: 1200px      │
│  Logo                   │  padding: 24px 32px     │
│  Nav links              │                         │
│  ─────────              │                         │
│  Account badges         │                         │
│  (bottom)               │                         │
└─────────────────────────────────────────────────┘
```

**Sidebar width**: 240px desktop, hidden on mobile (hamburger)
**Content max-width**: 1200px, centered
**Card grid**: 12-column grid. Cards span 4, 6, or 12 columns depending on content.

---

## Component Specs

### Card
```
background:   var(--bg-surface)
border:       1px solid var(--border-subtle)
border-radius: 12px
padding:      16px 20px
box-shadow:   0 1px 3px rgba(0,0,0,0.3)

hover:
  border-color: var(--border-default)
  box-shadow:   0 4px 12px rgba(0,0,0,0.4)
  transition:   all 150ms ease
```

### IPO Card (Dashboard)
```
Layout: horizontal — left info block | right actions
Left:
  - Company name (text-primary, 500, 14px)
  - Share type badge (see Badge spec)
  - Close date with countdown (JetBrains Mono, warning color if <24h)
  - Price: "Rs. 100" (JetBrains Mono, accent color)

Right:
  - Applied badge OR Apply button
  - Skip button (ghost, muted)

Top-right corner strip:
  - Red strip if closing today
  - Orange strip if closing tomorrow
  - No strip otherwise
```

### Button
```
Primary:
  bg: var(--accent-primary)
  text: #000000 (black on gold — high contrast)
  border-radius: 8px
  padding: 8px 16px
  font: DM Sans 500 13px
  hover: var(--accent-secondary)

Secondary (ghost):
  bg: transparent
  border: 1px solid var(--border-default)
  text: var(--text-secondary)
  hover: bg var(--bg-hover), text var(--text-primary)

Danger:
  bg: transparent
  border: 1px solid var(--status-error)
  text: var(--status-error)
  hover: bg rgba(239,68,68,0.1)

Disabled:
  opacity: 0.4
  cursor: not-allowed
```

### Badge / Status Pill
```
border-radius: 99px (fully rounded)
padding: 2px 8px
font: DM Sans 500 11px uppercase tracking-wide

Variants:
  success:  bg rgba(34,197,94,0.12)  text #22C55E
  warning:  bg rgba(245,158,11,0.12) text #F59E0B
  error:    bg rgba(239,68,68,0.12)  text #EF4444
  info:     bg rgba(59,130,246,0.12) text #3B82F6
  neutral:  bg rgba(107,114,128,0.12) text #6B7280
  accent:   bg rgba(245,166,35,0.12) text #F5A623
```

### Input / Form Field
```
bg: var(--bg-elevated)
border: 1px solid var(--border-default)
border-radius: 8px
padding: 10px 12px
font: DM Sans 400 14px
color: var(--text-primary)
placeholder: var(--text-muted)

focus:
  border-color: var(--border-focus)
  box-shadow: 0 0 0 3px rgba(245,166,35,0.15)
  outline: none

label:
  DM Sans 400 12px var(--text-secondary)
  margin-bottom: 6px
```

### Table
```
Header row:
  bg: var(--bg-elevated)
  text: var(--text-muted) DM Sans 500 11px UPPERCASE tracking-wider
  border-bottom: 1px solid var(--border-default)
  padding: 10px 16px

Data rows:
  text: var(--text-primary) DM Sans 400 13px
  padding: 12px 16px
  border-bottom: 1px solid var(--border-subtle)
  hover: bg var(--bg-hover)

Numbers:
  JetBrains Mono 500 — right-aligned always

Status column:
  Show badge component, not raw text

Striping:
  No zebra striping — use hover only
```

### Sidebar Nav Item
```
default:
  text: var(--text-secondary) DM Sans 400 14px
  padding: 10px 12px
  border-radius: 8px
  icon: 16px, same color as text

active:
  bg: var(--accent-muted)
  text: var(--accent-primary)
  icon: var(--accent-primary)
  border-left: 2px solid var(--accent-primary)

hover (non-active):
  bg: var(--bg-hover)
  text: var(--text-primary)
```

### Progress / Apply Live Feed
Used in Bulk Apply while applications are running:
```
Each row = one account + IPO combination
States:
  Waiting:    gray spinner icon  "Queued"
  In progress: blue pulse dot   "Applying..."
  Success:    green checkmark    "Applied — 10 kitta"
  Failed:     red X              "Failed: [reason]"
  Skipped:    dash (—)           "Already applied"

Row animates in as it starts (fade + slide up, 150ms)
Status icon swaps with a brief scale animation (200ms)
```

### Modal / Drawer
```
Backdrop: rgba(0,0,0,0.6) blur(4px)
Panel: var(--bg-elevated)
Border-radius: 16px (modal) or 0 right edge (drawer)
Max-width modal: 480px centered
Drawer: 400px from right, full height

Animation:
  Modal: fade + scale from 0.96 → 1 (200ms ease-out)
  Drawer: slide from right (250ms ease-out)
```

---

## Iconography

Use **Lucide React** exclusively. Size 16px for inline/table icons, 20px for nav.
Never mix icon libraries.

Key icons used:
```
LayoutDashboard  → Dashboard nav
Users            → Accounts nav
Send             → Apply nav
BarChart2        → Reports nav
Calendar         → Calendar nav
TrendingUp       → Portfolio nav
Settings         → Settings nav
CheckCircle      → Success
XCircle          → Error
Clock            → Pending / countdown
AlertTriangle    → Warning
ChevronRight     → Row expand
Download         → Export
RefreshCw        → Refresh / health check
Zap              → Quick apply / run now
```

---

## Micro-interactions & Animations

Keep animations functional — they communicate state, not decorate.

```css
/* Page transition */
.page-enter {
  opacity: 0;
  transform: translateY(8px);
  animation: pageIn 200ms ease-out forwards;
}
@keyframes pageIn {
  to { opacity: 1; transform: translateY(0); }
}

/* Card hover lift */
.card { transition: box-shadow 150ms ease, border-color 150ms ease; }

/* Button press */
.btn:active { transform: scale(0.97); }

/* Status badge swap */
.status-swap { animation: statusIn 200ms ease-out; }
@keyframes statusIn {
  from { transform: scale(0.8); opacity: 0; }
  to   { transform: scale(1);   opacity: 1; }
}

/* Countdown pulse (closing today) */
.countdown-urgent {
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}

/* Apply progress row enter */
.progress-row-enter {
  animation: rowIn 150ms ease-out;
}
@keyframes rowIn {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

**Rule**: No animation exceeds 300ms. No animation runs on mount unless it communicates
state change. No bounce, no spring physics. Ease-out only.

---

## Responsive Breakpoints

```
Mobile  < 640px   — sidebar hidden, hamburger menu, single column
Tablet  640–1024px — sidebar collapses to icon-only (48px)
Desktop > 1024px  — full 240px sidebar, multi-column grid
```

On mobile:
- Bottom tab bar replaces sidebar (Dashboard, Apply, Reports, Accounts)
- Cards go full width
- Tables scroll horizontally
- Bulk apply shows accordion not side-by-side

---

## Empty States

Every table and list must have a designed empty state. Never show a blank area.

```
IPO Dashboard — no open IPOs:
  Icon: Coffee (Lucide)
  Title: "No open IPOs right now"
  Sub: "Check back during subscription windows. Usually Sunday–Thursday."

Application History — no records:
  Icon: FileText
  Title: "No applications yet"
  Sub: "Once you apply for an IPO, your history will appear here."

Bulk Report — no data:
  Icon: BarChart2
  Title: "Nothing to report"
  Sub: "Apply for some IPOs first."
```

---

## Loading States

```
Page load:
  Skeleton cards — same size/shape as real cards
  bg: var(--bg-elevated) with shimmer animation
  Never use a full-page spinner

Table loading:
  5 skeleton rows, each with 4 grey blocks matching column widths

Button loading:
  Replace label with spinner icon (Loader2, animate-spin)
  Keep button width stable (no layout shift)
  Disable pointer events
```

---

## Error & Toast Notifications

```
Toast position: top-right, 16px from edges
Max width: 360px
Stack: newest on top, max 3 visible

Variants:
  success — left border 3px solid --status-success
  error   — left border 3px solid --status-error
  warning — left border 3px solid --status-warning
  info    — left border 3px solid --status-info

Auto-dismiss: 5s (errors stay until dismissed)
Entry animation: slide in from right (200ms)
Exit animation: slide out to right + fade (150ms)
```

---

## Data Visualization (Reports & Portfolio)

All charts use **Recharts**. Follow these rules:

```
Colors for chart series:
  Account 1: #F5A623 (accent)
  Account 2: #3B82F6 (blue)
  Account 3: #22C55E (green)
  Account 4: #A855F7 (purple)
  Account 5: #F97316 (orange)

Grid lines:
  stroke: var(--border-subtle)
  strokeDasharray: "4 4"

Axis labels:
  fill: var(--text-muted)
  fontSize: 11
  fontFamily: JetBrains Mono

Tooltip:
  bg: var(--bg-elevated)
  border: 1px solid var(--border-default)
  borderRadius: 8px
  DM Sans 13px

Bar chart (kitta applied vs allotted):
  Applied bar: accent color at 40% opacity
  Allotted bar: accent color solid

Line chart (portfolio value over time):
  Stroke: accent color
  Dot: filled, white center
  Area below line: accent at 10% opacity
```

---

## PIN Lock Screen

Shown on app load and after 30 min idle.

```
Layout: centered vertically, dark bg
Logo + "MeroShare IPO" above
Subtitle: "Enter PIN to continue"

PIN input:
  4 large dots (filled/empty)
  Numeric keypad (3x4 grid) — mobile style
  Backspace button

On wrong PIN:
  Dots shake left-right (CSS transform, 300ms)
  Shake animation, then reset

On correct PIN:
  Dots flash green briefly
  Screen fades out (200ms), dashboard fades in
```

---

## Accessibility Minimum

- All interactive elements have `:focus-visible` outline (3px, accent color)
- Color is never the only way to convey status — always pair with icon or text
- Contrast ratio: text vs background minimum 4.5:1 (AA)
- All icon-only buttons have `aria-label`
- Tables have `scope` on headers
- Modal traps focus; Escape closes it
- Keyboard navigable sidebar

---

## Do Not

- No gradients on buttons (flat accent only)
- No drop shadows on text
- No card carousels — use tabs or scrollable lists
- No full-screen loading spinners
- No modal on mobile for forms — use bottom sheet drawer
- No placeholder text as labels (always use real labels above input)
- No red text on dark red background (fails contrast)
- No purple — not in this palette
- No hover tooltips on data that should just be visible in the table

---

## When Claude Is Building UI Components

1. Always import from `lucide-react` for icons
2. Always use CSS variables via `var(--token)` — never hardcode hex colours
3. Apply `font-mono` (JetBrains Mono) to all number/data cells via Tailwind
4. Every button must have a loading state variant
5. Every data list must have an empty state component
6. Use `transition-all duration-150` on cards and interactive elements
7. Skeleton loaders match the exact shape of the real component
8. Apply page-enter animation to every page component on mount
9. Confirm destructive actions (delete account, bulk apply) with a modal — never inline
10. Status text must always be paired with a StatusBadge component, never raw strings
