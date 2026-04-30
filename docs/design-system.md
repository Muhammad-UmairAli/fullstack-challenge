# 🎨 Portfolio Design System

This document outlines the visual theme and design system for the **Fullstack Enterprise Architecture**, tailored for a premium, software developer portfolio aesthetic. This design system emphasizes modern, professional aesthetics with full support for both light and dark modes across all components.

---

## 🌓 Theming Philosophy

The system is designed with a **Dark-First** immersive experience, balanced by a **Clean Professional** Light Mode. Every component is built to be fully responsive and accessible (WCAG AA compliant, 4.5:1 contrast ratio).

### Core Principles

- **Modern Typography**: Inter and SF Pro for a clean, tech-inspired feel.
- **Glassmorphism**: Subtle frosted glass effects (`backdrop-filter`) for depth and premium feel.
- **Micro-interactions**: Smooth 0.3s transitions, hover lifts, and subtle glow effects.
- **High Contrast**: Ensuring readability across all lighting conditions.

---

## 🎨 Color Palettes (OKLCH/HSL)

We use CSS variables to manage the theme tokens. This allows for seamless toggling between light and dark modes.

### Light Mode (Professional Daytime)

- `--bg-primary`: `#ffffff` (Pure white background)
- `--bg-secondary`: `#f8fafc` (Light slate for contrast)
- `--text-primary`: `#0f172a` (Dark slate for readability)
- `--text-secondary`: `#64748b` (Cool gray for secondary info)
- `--accent`: `#3b82f6` (Vibrant blue for CTAs)
- `--accent-hover`: `#1d4ed8` (Deep blue)
- `--border-color`: `#e2e8f0` (Subtle light borders)
- `--card-bg`: `#ffffff` (Solid card background)

### Dark Mode (Immersive Night)

- `--bg-primary`: `#0f0f23` (Deep navy/charcoal)
- `--bg-secondary`: `#1e1e2e` (Darker slate)
- `--text-primary`: `#ffffff` (Pure white text)
- `--text-secondary`: `#a3a3a3` (Soft gray for hierarchy)
- `--accent`: `#22c55e` (Neon green for a tech pop)
- `--accent-hover`: `#16a34a` (Darker forest green)
- `--border-color`: `#27272a` (High-contrast dark borders)
- `--card-bg`: `rgba(255, 255, 255, 0.05)` (Frosted glass effect)

---

## 🖋️ Typography

| Element          | Specification       | Visual Notes                            |
| :--------------- | :------------------ | :-------------------------------------- |
| **Primary Font** | `Inter` or `SF Pro` | Sans-serif, modern tech feel.           |
| **H1 Heading**   | 48px, Semi-bold     | -0.02em letter-spacing for impact.      |
| **H2 Heading**   | 32px, Semi-bold     | Main section titles.                    |
| **H3 Heading**   | 24px, Medium        | Sub-section headers.                    |
| **Body Text**    | 16px, Regular       | 1.6 line-height for optimal legibility. |

---

## 🧩 Component Specifications

### 1. Navigation (Sticky)

- **Light**: White background with a very light shadow.
- **Dark**: 80% opacity navy background with a `blur(12px)` backdrop filter.
- **Interaction**: Links show accent color only on hover.

### 2. Glass Cards (`glass-card`)

- **Base**: Rounded corners (12px), subtle border, and shadow.
- **Hover**: 1.05x scale, 1.02x lift, and a glow effect (`--glow`) matching the accent color.

### 3. Primary Buttons (`btn-primary`)

- **Base**: `padding: 12px 32px`, `border-radius: 12px`.
- **Light**: Blue background with white text.
- **Dark**: Neon green background with deep navy text.

---

## 🚀 Implementation (CSS Snipet)

```css
@theme {
  --color-background: var(--bg-primary);
  --color-foreground: var(--text-primary);
  --color-primary: var(--accent);
}

.glass {
  background: var(--card-bg);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow);
}

.btn-primary {
  @apply px-8 py-3 rounded-xl font-medium transition-all duration-300;
  background-color: var(--accent);
  color: var(--bg-primary);
}
```

---

## 📱 Responsiveness & Accessibility

- **Vertical Stacking**: All grids transition to 1-column layout on mobile (<768px).
- **Contrast**: All color combinations exceed WCAG AA requirements (4.5:1 ratio).
- **Motion**: Subtle fade-ins on scroll to guide the user's eye without causing fatigue.
