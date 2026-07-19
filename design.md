# Design

For product intent see [`PRODUCT.md`](./PRODUCT.md), for code structure see
[`ARCHITECTURE.md`](./ARCHITECTURE.md), for test conventions see [`TESTING.md`](./TESTING.md).
This file is the single source of truth for the app's visual language: palette, typography,
shape/elevation, iconography, and the accessibility floor every screen must clear. It compiles
two decisions made across a design-review pass (three comparison artifacts, not committed to the
repo):

- **Option B — « Portée douce »** was chosen as the design system: lavender/sage, generous
  rounding, low visual density — built to reduce sensory load on the daily check-in, the screen
  a person with ADHD opens every day.
- **Style 3 — Accessible & Ethical** was chosen as the accessibility layer on top of it: 7:1
  contrast where practical, Atkinson Hyperlegible for anything read, 3-4px focus rings, 44×44
  touch targets, and colour never used alone to carry a signal.

These are one system, not two competing ones. Where they conflicted (Option B originally proposed
Raleway for body text; Style 3 requires the most legible typeface practical), Style 3 wins on
anything functional or read, and Option B keeps its personality in display headings and shape.

## Palette

| Token | Hex | Role |
|---|---|---|
| `primary` | `#6E5FA8` | Buttons, active states, primary chrome (darkened from Option B's raw `#8F7FC4`, which read 3.5:1 on white — below AA) |
| `primary-dark` / `ink` | `#4B3A63` | Body text, headings — 9.5–10:1 on `bg`/`surface` |
| `primary-light` | `#EDE9F5` | Tinted highlight surfaces (replaces the old `vert-light` highlight-strip role) |
| `accent` | `#3D7A5F` | Sage green, secondary emphasis only — never used for brand chrome and never for clinical status |
| `muted` | `#5E4F76` | Secondary/caption text — 6.9–7.4:1, clears AAA |
| `bg` | `#FAF7FC` | Page background |
| `surface` | `#FFFFFF` | Cards, panels |
| `border` | `#E9E2F2` | Dividers — decorative only; a boundary is never signalled by border colour alone, always paired with a surface/elevation change |

Renamed from the previous `vert` / `vert-dark` / `vert-light` / `jaune` / `creme` tokens — those
names became actively misleading once the palette moved from green/yellow to lavender/sage. See
`tailwind.config.js` for the Tailwind theme extension.

### Semantic status colours — separate from brand accent

Clinical severity (the Likert scale, wear-off, side-effect severity, save errors) is **never**
`primary` or `accent`. It has its own three-step vocabulary, single source of truth in
`src/utils/severityColors.js`:

| Token | Text | Background | Contrast |
|---|---|---|---|
| `success` | `#2F6B44` | `#EAF3EC` | 5.6:1 |
| `warning` | `#6B5814` | `#FCF3D9` | 6.3:1 |
| `danger` | `#9C3C3D` | `#FBEAE8` | 5.8:1 |

The Likert 1–5 gradient interpolates through these three anchors (levels 1/3/5) plus two
intermediate steps (2/4), all re-tuned darker than Option B's original pastel mockup so every step
clears 4.5:1 minimum on its own background. `hexForLevel()`/`tintForLevel()` keep their existing
signatures — nothing downstream of `severityColors.js` needs to change its API.

**Never colour alone.** Per Style 3's "symbol-based, not colour-only" requirement: the Likert
already carries a number (1–5) independent of colour; wear-off and side-effect severity carry a
text label (`Léger`/`Modéré`/`Sévère`) independent of colour; the report's dimension chart and
day-of-week heatmap get a numeric value printed on every bar/cell (see *Charts*, below) so nothing
in the app relies on hue alone to be legible.

## Typography

| Role | Face | Notes |
|---|---|---|
| Display (`font-display`) | Lora | Page titles, report headline, narrative-synthesis heading only |
| Body / functional (`font-sans`, the default) | Atkinson Hyperlegible | Everything read: paragraphs, labels, buttons, form inputs, nav. Replaces DM Sans app-wide and the Raleway originally paired with Option B — designed by the Braille Institute specifically for low-vision legibility, which outranks Option B's softer pairing on a screen meant to be read quickly by someone with working-memory strain |
| Data (`font-mono`, unchanged) | JetBrains Mono | Times, counts, dosage, percentages — anything tabular |

Both new families are loaded the same way DM Sans/JetBrains Mono already are: a real Google Fonts
`<link>` in `index.html` (this app has no CSP restriction on external fonts).

Named type scale — use these roles, not ad hoc `text-*` sizes, when touching a component:

| Role | Size | Face |
|---|---|---|
| `caption` | 12px | Atkinson |
| `body` | 14px | Atkinson |
| `label` | 14px / 600 | Atkinson |
| `section-title` | 16–18px / 600 | Atkinson |
| `page-title` / `display` | 22–28px / 600 | Lora |
| `data-display` | 20–24px / 700 | JetBrains Mono |

## Shape & elevation

- **Radius** — `sm` 10–12px (pills, inputs, small buttons), `lg` 20–22px (cards, main panels).
  Generalises Option B's very-rounded mood project-wide, replacing the previous mix of
  `rounded-lg`/`rounded-xl`/`rounded-2xl`.
- **Elevation** — three named tiers, chosen by role, not by component author's preference:
  - **flat** — border only, no shadow (inline/nested elements)
  - **raised** — soft diffuse shadow (header, panels, tab bar)
  - **floating** — stronger soft shadow (blocking screens: unreadable-data screen, reset
    confirmation, onboarding)
- **Focus** — every interactive element gets a 3px `primary`-coloured ring, 2px offset. Extends
  what the July 2026 accessibility pass already added to some controls; this pass makes it
  universal.
- **Touch targets** — 44×44px minimum everywhere, already partly enforced and covered by
  `e2e/regression-checks.spec.js`'s `boundingBox()` assertions — must not regress when
  radius/padding change.

## Icons

Structural emoji (💊 🧠 ⏱️ ⚠️ 📝 ✅ ✏️ 📊 📅) are replaced by a small internal SVG set — 1.75px
stroke, `currentColor`, so they inherit whatever token colours the surrounding text does, unlike
an emoji glyph which renders however the OS/browser font decides. Each icon keeps the exact same
`aria-hidden="true"` + adjacent visible text label it replaces — no accessible-name changes.
Plain Unicode punctuation used as structural marks (`✓`/`+` in `DayStrip`, `☐` in the report's
"points à discuter" checklist) is out of scope — it's typographic, not a multi-colour glyph, and
already renders consistently as text.

## Charts (Report.jsx)

- Dimension bar chart and day-of-week heatmap print the numeric value on/beside every bar/cell,
  not just colour — the colour-only legend below the chart was the one place in the app where a
  status was carried by hue alone.
- Legend moves adjacent to the axis instead of sitting detached below the chart.
- The stray inline `fill="#f97316"` in `SideEffectSection`'s bar chart (a one-off hex never tied to
  any token) is replaced by a value pulled from the shared `warning`/`danger` scale above.

## What this pass does not touch

Data model, `localStorage` key (`ammt_v2`), accordion auto-advance logic, the MVP scope boundary in
`PRODUCT.md` → *Out of scope*, and the `.impeccable/` submodule are all unaffected — this is a
visual/token migration, not a behavioural one. `PRODUCT.md`'s *Brand Personality* prose ("deep
green + yellow accents on a warm cream background") describes the *previous* palette in
product-register language; updating that description is a product decision for P-C, tracked
separately, not rewritten as a side effect of this file.
