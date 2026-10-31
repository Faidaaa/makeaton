# Design System Specification & Style Guide

A clean, high-contrast, minimalist design language inspired by modern developer and community event UI frameworks. Designed for high clarity, distinct spatial structure, and effortless adaptability across web and desktop interfaces.

---

## 1. Visual Philosophy & Core Principles

- **High Contrast & Sharp Structure:** Clear, bold text combined with high-contrast container outlines (`2px` solid dark borders) to define distinct boundaries without visual clutter.
- **Micro-Skeuomorphic & Utility Accents:** Subtle references to tactile, physical elements (e.g., ticket stubs, airport-style displays, badge tags) created purely using CSS layout rules without relying on heavy external images.
- **Punchy Color Palette:** A base neutral background (warm off-white or clean stark white) balanced by single high-energy accent colors (vibrant orange/vermilion, royal electric blue) used intentionally for primary CTAs and state indicators.
- **Modular & Scannable Layouts:** Heavy reliance on structured grids, clear tabular blocks, and stark horizontal dividers (`---`) to separate primary narrative flows.

---

## 2. Color Palette & CSS Custom Properties

```css
:root {
  /* Surface & Background Colors */
  --bg-primary: #fcfbf9;         /* Warm neutral background */
  --bg-surface: #ffffff;         /* Pure white container surface */
  --bg-subtle: #f4f3f0;          /* Secondary panel/card background */

  /* Text & Border Colors */
  --text-primary: #111827;       /* Deep charcoal / near black */
  --text-secondary: #6b7280;     /* Muted grey for subtext and captions */
  --border-strong: #000000;      /* Crisp, high-contrast black border */
  --border-subtle: #e5e7eb;      /* Soft structural dividers */

  /* Accent & State Colors */
  --accent-primary: #ff4f00;     /* Electric vermilion / high-energy orange */
  --accent-secondary: #2563eb;   /* Deep electric blue */
  --accent-light: #fff4ed;       /* Light tint background for callouts */
  
  /* Typography Variables */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

---

## 3. Typography Hierarchy

| Level | Desktop Size | Weight | Letter Spacing | Styling / Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Title (`h1`)** | `3.5rem` (`56px`) | Extra Bold (`800`) | `-0.03em` | Display headers, primary page hero headings |
| **Section Header (`h2`)** | `2.25rem` (`36px`) | Bold (`700`) | `-0.02em` | Major page sections and key feature groupings |
| **Subheader (`h3`)** | `1.5rem` (`24px`) | SemiBold (`600`) | `-0.01em` | Subsection titles, card group headers |
| **Body Text (`p`)** | `1.0rem` (`16px`) | Regular (`400`) | `0.0em` | Standard descriptive text, high-legibility standard |
| **Monospace / Utility** | `0.875rem` (`14px`)| Medium (`500`) | `+0.05em` | Timestamps, tags, badge labels, code snippets |

```css
/* Typography Utility Style Example */
h1 {
  font-family: var(--font-sans);
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: var(--text-primary);
}

.label-mono {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

---

## 4. UI Components & Layout Building Blocks

### A. Navigation Bar
- **Style:** Compact top bar with a clean logo mark on the left and inline navigation links on the right.
- **CTA Integration:** Primary action button directly embedded into the navigation row for quick conversion.

```css
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background-color: var(--bg-surface);
  border-bottom: 2px solid var(--border-strong);
}
```

### B. Action Buttons
- **Primary Button:** High-contrast pill-shaped or sharp-cornered container with vibrant accent background and high-contrast hover state.
- **Secondary / Ghost Button:** Transparent background, dark `2px` border, subtle background shift on hover.

```css
.btn-primary {
  background-color: var(--accent-primary);
  color: #ffffff;
  font-weight: 700;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px; /* Pill shape */
  border: 2px solid var(--border-strong);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 0 var(--border-strong);
}
```

### C. Stat Cards & Numeric Display Blocks
- **Concept:** Highlight key quantitative metadata (e.g., counts, dates, durations) using big bold values coupled with small uppercase labels below.

```css
.stat-card {
  padding: 1.25rem;
  background: var(--bg-surface);
  border: 2px solid var(--border-strong);
  border-radius: 8px;
  text-align: left;
}

.stat-value {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-primary);
}

.stat-label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}
```

### D. Structured Content Tables & Lists
- **Structure:** Clean, borderless horizontal rows separated by faint dividers or bold box outlines. Monospace tags used for categories/timestamps.

```css
.table-custom {
  width: 100%;
  border-collapse: collapse;
}

.table-custom th {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  text-transform: uppercase;
  border-bottom: 2px solid var(--border-strong);
  padding: 0.75rem;
  text-align: left;
}

.table-custom td {
  padding: 0.875rem;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 0.95rem;
}
```

### E. Accordion / FAQ Modules
- **Design:** Expandable full-width blocks with clear `+` / `−` indicators on the right, utilizing monospace text for section markers.

```css
.accordion-item {
  border-bottom: 1px solid var(--border-subtle);
  padding: 1rem 0;
}

.accordion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  cursor: pointer;
}
```

---

## 5. Spacing, Layout & Micro-Interactions

- **Grid System:** Flexible CSS Grid or Flexbox alignment with consistent `1.5rem` (24px) or `2rem` (32px) standard gaps.
- **Borders over Shadows:** Rely primarily on clean `1px` to `2px` black/dark borders to group content instead of heavy, soft drop shadows.
- **Tactile Hover States:** Slight upward translates (`translateY(-2px)`) accompanied by solid offsets (`box-shadow: 2px 2px 0 #000`) for interactive elements to emphasize tactile feedback.
- **Whitespace:** Ample vertical padding (`4rem` to `6rem` per page section) to keep information uncluttered and effortless to skim.

