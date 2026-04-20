# Design Brief

**Purpose**: Modern AI-powered news recommendation platform delivering personalized, discoverable content with authentication, search, and upload capabilities. Users browse curated recommendations across multiple sections, interact with articles, and explore by region/interest.

**Tone**: Editorial + tech platform — Google News clarity meets YouTube engagement. Clean, scannable, intentional visual hierarchy. Dark mode optimized for reading comprehension.

**Differentiation**: Hero featured article above three-section homepage (Recommended, Trending, Based on Interests). Article cards with large thumbnails, category accent badges, interaction counts. Sidebar category nav. Always-visible search. Responsive from mobile to desktop. Elevated card states with subtle hover effects.

## Color Palette

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| **Primary** | `0.38 0.08 260` (slate-blue) | `0.70 0.10 260` | Sign-in buttons, form focus, link hover |
| **Accent** | `0.67 0.18 200` (cyan) | `0.72 0.20 200` | Category badges, highlights, active states, featured article border |
| **Secondary** | `0.92 0 0` | `0.20 0 0` | Secondary buttons, neutral interactive elements |
| **Muted** | `0.88 0 0` | `0.22 0 0` | Section backgrounds, disabled states, subtle separators |
| **Destructive** | `0.55 0.22 25` (red) | `0.65 0.19 22` | Delete, error states, urgent actions |
| **Success** | Chart-1 (cyan) | Chart-1 (cyan) | Upload success, saved articles, positive feedback |

## Typography

| Layer | Family | Size | Weight | Usage |
|-------|--------|------|--------|-------|
| **Display** | General Sans | 28–48px | 600–700 | Page titles, article headlines, metric labels |
| **Body** | DM Sans | 14–16px | 400–500 | Article text, UI labels, metadata |
| **Mono** | Geist Mono | 12–14px | 400 | Code snippets, metric raw values, algorithm names |

## Structural Zones

| Zone | Treatment | Detail |
|------|-----------|--------|
| **Header** | `bg-card` with `border-b`, sticky | Logo, search bar (always visible), user menu (sign-in/profile/logout) |
| **Sidebar** | `bg-sidebar` collapsible to hamburger on mobile | Category filters, region selector, saved articles, upload link |
| **Hero Section** | `card-hero` full-width overlay | Featured article with large image, title, category badge, read time |
| **Main Content** | `bg-background` three-column sections | Recommended (personalized), Trending (global), Based on Interests (user profile) |
| **Article Card** | `card-elevated` responsive grid | 16:9 thumbnail, title, category badge (cyan accent), view count, date |
| **Empty States** | `bg-muted/20` centered text | Clear messaging for unauthenticated users or no recommendations |

## Spacing & Rhythm

- **Grid**: 8px base unit; 4px fine-tuning for typography
- **Card padding**: 16–24px (2–3 units)
- **Metric blocks**: 12px gap between items
- **Section margins**: 32px vertical (4 units) for breathing room

## Component Patterns

- **Article Cards**: Thumbnail (16:9 aspect) + title overlay or below + category badge (cyan accent) + metadata (view count, date, read time)
- **Hero Article**: Full-width card with large image, overlay gradient, title/summary positioned over image, category badge top-left
- **Category Badges**: `badge-category` utility — cyan accent background, thin left border, rounded corners
- **Section Headers**: Display font, 24px bold, 8px accent underline in cyan
- **Interaction Cards**: Like/bookmark/share buttons with count badges, subtle bg-muted/20 on hover
- **Empty States**: Centered illustration + encouraging text + CTA button (sign-in or explore categories)

## Motion

- **Transitions**: `transition-smooth` (0.3s ease) on card elevation, button states, sidebar collapse
- **No entrance animations** — favor immediate clarity and fast perceived load
- **Hover states**: Card shadow elevation `sm:shadow-lg`, border accent hint, background tone increase; no scale

## Constraints

- **No gradients** — flat colors only, reinforcing editorial clarity and legibility
- **Minimal decoration** — focus on content, not chrome; every element must serve UX
- **Radius scale**: 6px base (cards, buttons, inputs) — slightly rounded for friendliness without softness
- **Shadows**: Layered hierarchy — `shadow-sm` (inputs), `shadow-md` (cards), `shadow-lg` (hero, modals)
- **Dark mode default**: Optimized for reading; high contrast text, muted section backgrounds, cyan accents pop

## Signature Detail

**Cyan accent on article cards**: Accent-colored category badges pop against dark bg, hinting at AI/computational nature. Featured article hero has cyan accent underline. Sidebar category filters use accent color to indicate active selection. This creates a cohesive accent narrative tied to recommendation intelligence.

## Fonts

- **Display**: General Sans (geometric, tech-forward, data-centric)
- **Body**: DM Sans (highly legible at small sizes, clean terminals)
- **Mono**: Geist Mono (technical, code-aware)

