---
name: SecureOrg
colors:
  surface: '#f9f9ff'
  surface-dim: '#d0daf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e8eeff'
  surface-container-high: '#dfe8ff'
  surface-container-highest: '#d9e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#43474f'
  inverse-surface: '#273143'
  inverse-on-surface: '#ecf0ff'
  outline: '#737780'
  outline-variant: '#c3c6d0'
  surface-tint: '#3f5f8d'
  primary: '#00254b'
  on-primary: '#ffffff'
  primary-container: '#173b67'
  on-primary-container: '#86a6d8'
  inverse-primary: '#a8c8fc'
  secondary: '#2060a3'
  on-secondary: '#ffffff'
  secondary-container: '#80b6fe'
  on-secondary-container: '#004681'
  tertiary: '#3a1d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#593000'
  on-tertiary-container: '#d4975f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#a8c8fc'
  on-primary-fixed: '#001c3b'
  on-primary-fixed-variant: '#264774'
  secondary-fixed: '#d4e3ff'
  secondary-fixed-dim: '#a4c9ff'
  on-secondary-fixed: '#001c39'
  on-secondary-fixed-variant: '#004883'
  tertiary-fixed: '#ffdcc0'
  tertiary-fixed-dim: '#fab97e'
  on-tertiary-fixed: '#2d1600'
  on-tertiary-fixed-variant: '#683c0b'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d9e3fb'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system is built for an enterprise cybersecurity and organizational security administration SaaS dashboard. The target audience consists of Chief Information Security Officers (CISOs), security operations analysts, IT administrators, and compliance managers who require immediate clarity, high data density without visual clutter, and an interface that communicates reliability and authority.

The emotional response should be one of calm control, precision, and institutional trust. Every visual decision prioritizes legibility, scannability, and rapid threat or status assessment over decorative flair.

The aesthetic blends **Corporate / Modern** structure with **Minimalism**:
- **Structured & Reliable:** Grounded layouts, predictable navigation, and familiar Material UI (MUI) component patterns reduce cognitive load during high-stakes administrative tasks.
- **Clean & Uncluttered:** Generous breathing room around dense data tables, crisp 1px borders, and restrained surface contrast keep focus on security metrics and organizational policies.
- **Strict Restraint:** Neon accents, glassmorphism, and excessive gradients are strictly excluded to preserve an authoritative, distraction-free workspace.

## Colors

The palette is anchored in a light-mode, high-contrast neutral foundation that supports extended reading of audit logs, policy tables, and system statuses.

### Core & Surface Tokens
- **Primary (`#173B67`):** Deep navy used for primary actions, active navigation states, key brand moments, and primary data series.
- **Secondary (`#2563A6`):** Steel blue used for interactive links, secondary actions, focus rings, and supporting chart series.
- **Background (`#F5F7FA`):** Cool, subtle off-white canvas that separates the workspace backdrop from elevated content cards.
- **Surface (`#FFFFFF`):** Pure white for cards, data tables, modals, and sidebars.
- **Border (`#E4E9F0`):** Crisp, low-contrast hairline border used to define card boundaries, table rows, and input outlines.

### Typography & Semantic Tokens
- **Main Text (`#172B4D`):** Deep slate-navy for primary headings, table values, and body copy, ensuring WCAG AA/AAA contrast on white surfaces.
- **Secondary Text (`#667085`):** Muted slate gray for metadata, timestamps, helper text, and table column headers.
- **Success (`#16865C`):** Used for compliant states, verified identities, and resolved security incidents.
- **Warning (`#D99219`):** Used for pending reviews, expiring certificates, and medium-severity alerts.
- **Danger (`#D64545`):** Reserved for critical vulnerabilities, failed access attempts, and destructive actions.

### Usage Rules
- Use semantic colors sparingly—primarily in status badges, inline alerts, and small indicator dots—so critical security events stand out immediately.
- Avoid gradients on surfaces or buttons; rely on solid fills and subtle hover/active state shifts.

## Typography

`Inter` is used across all typographic roles to provide a unified, crisp, and highly legible sans-serif system optimized for UI density and tabular data.

- **Tabular Numerals:** Enable `font-variant-numeric: tabular-nums` on all KPI metrics, IP addresses, timestamps, and data table columns to ensure vertical alignment when scanning numbers.
- **Hierarchy:** Page titles use `headline-lg` (scaling down to `headline-lg-mobile` below `768px`), section headers use `headline-sm` or `title-lg`, and dense table cells use `body-md` (`14px`) or `body-sm` (`13px`) paired with `label-md` (`12px`) column headers.
- **Scannability:** Keep line lengths between 60–75 characters for policy descriptions and incident summaries.

## Layout & Spacing

The layout uses a **12-column fluid grid** designed to accommodate complex administrative dashboards, multi-pane views, and wide data tables.

### Grid & Breakpoints
- **Desktop (`>= 1200px`):** 12-column fluid grid with `1.5rem` (`24px`) outer canvas margins and `1rem` (`16px`) column gutters. A persistent left navigation sidebar (`240px`–`260px` wide) sits alongside the fluid main content area.
- **Tablet (`768px` – `1199px`):** 8-column fluid grid with `1.5rem` margins and `1rem` gutters. The navigation sidebar collapses into a toggleable drawer. Multi-column KPI rows reflow from 4-up to 2-up.
- **Mobile (`< 768px`):** 4-column fluid grid with `1rem` (`16px`) outer margins and `0.75rem` (`12px`) gutters. Cards stack vertically (`100%` width), and wide data tables scroll horizontally within their card container.

### Spacing Rhythm
- Use `space-xs` (`4px`) and `space-sm` (`8px`) for tight internal component gaps, such as icon-to-label spacing and badge padding.
- Use `space-md` (`16px`) for standard form field gaps and compact card padding.
- Use `space-lg` (`24px`) for primary card padding and vertical separation between dashboard sections.
- Use `space-xl` (`32px`) for major page header separations.

## Elevation & Depth

Visual hierarchy relies on **low-contrast outlines** paired with **restrained ambient shadows** for interactive overlays.

- **Base Cards & Panels:** Use a pure white surface (`#FFFFFF`) against the `#F5F7FA` background, defined by a crisp `1px solid #E4E9F0` border and a barely perceptible resting shadow (`0 1px 2px rgba(23, 43, 77, 0.04)`).
- **Interactive Hover:** Clickable cards or table rows may subtly shift background tint (e.g., `#F8FAFC`) rather than lifting aggressively.
- **Overlays (Dropdowns, Popovers, Modals):** Use a `1px solid #E4E9F0` border combined with a diffused, low-opacity shadow (`0 8px 24px rgba(23, 43, 77, 0.08)`) to clearly separate floating menus from underlying data.
- **No Glassmorphism:** All surfaces remain 100% opaque to guarantee maximum text contrast and legibility.

## Shapes

The shape language is **Rounded** (`0.5rem` / `8px` base radius), striking a balance between modern SaaS approachability and enterprise precision.

- **Cards, Modals & Containers:** Use the `8px` (`0.5rem`) radius consistently across dashboard cards, alert banners, and dialog boxes.
- **Inputs, Buttons & Small Controls:** Use `6px` (`0.375rem`) or `8px` (`0.5rem`) to align cleanly with Material UI (MUI) defaults.
- **Status Chips & Badges:** Use `4px` (`0.25rem`) for compact rectangular tags or full pill rounding (`9999px`) for small count indicators.

## Components

All components are structured to map cleanly to Material UI (MUI) primitives while enforcing the design system's typography, `1px` borders, and restrained color palette.

### Buttons
- **Primary:** Solid `#173B67` fill, `#FFFFFF` text, `8px` radius, `label-lg` typography. Hover darkens slightly to `#102A4A`.
- **Secondary / Outlined:** `#FFFFFF` fill, `1px solid #E4E9F0` border, `#172B4D` text. Hover shifts background to `#F5F7FA`.
- **Destructive:** Solid `#D64545` fill with `#FFFFFF` text, or outlined `#D64545` for secondary confirmation actions.

### Chips & Status Badges
- Use soft, low-saturation backgrounds tinted from semantic colors (e.g., 10% opacity of `#16865C`, `#D99219`, or `#D64545`) paired with full-saturation semantic text and an optional `6px` status dot.

### Lists & Data Tables
- **Headers:** `#F8FAFC` or `#FFFFFF` background with a `1px solid #E4E9F0` bottom border and `label-md` (`12px`, `#667085`) uppercase or sentence-case labels.
- **Rows:** `48px`–`52px` standard row height, `1px solid #E4E9F0` horizontal dividers, and `#F5F7FA` hover state. No vertical cell borders.

### Checkboxes & Radio Buttons
- `18px`–`20px` hit-target visuals with `1.5px` `#667085` borders in resting state. Checked state uses `#173B67` fill with a crisp `#FFFFFF` checkmark or inner dot.

### Input Fields
- `#FFFFFF` background, `1px solid #E4E9F0` border, `8px` radius, and `40px` standard height.
- Focus state applies a `1px solid #2563A6` border with a subtle `0 0 0 3px rgba(37, 99, 166, 0.15)` focus ring. Error state uses `#D64545`.

### Cards
- `#FFFFFF` surface, `1px solid #E4E9F0` border, `8px` radius, and `24px` (`space-lg`) internal padding.

### Security-Specific Components
- **Alert Banners:** Full-width `8px` rounded containers with a `4px` left accent bar in the semantic color (`#16865C`, `#D99219`, or `#D64545`), `#FFFFFF` or lightly tinted background, and a clear action link.
- **Audit Log Rows:** Monospace or tabular-numeral timestamps in `#667085`, actor identity in `#172B4D`, and a compact status chip aligned to the right.