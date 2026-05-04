# AGENTS.md

## Frontend Style Guide

These rules apply to frontend changes in this Hexo blog, especially under `themes/hexo-theme-Klise-enhanced/`.

### Visual Direction

- Keep the site light, airy, personal, and editorial. The design should feel like a quiet image-first blog, not a dashboard or SaaS UI.
- Preserve the existing anime/photo wallpaper atmosphere. UI should sit gently over the background instead of fighting it.
- Prefer subtle glass, light borders, and restrained shadows. Avoid heavy cards, oversized pills, and loud badges unless the user explicitly asks for emphasis.
- Do not introduce generic purple/dark-mode-first UI patterns. Match the current warm paper, soft blue, muted ink, and photographic tones.

### Typography And Links

- Preserve the current serif/Chinese font feeling. Do not replace it with default system, Inter, Roboto, Arial, or other generic stacks.
- Text links in tag-like areas should feel lightweight: inline, colored, and flowing horizontally.
- Disable or override global link underline animations when they interfere with navigation, tag clouds, category clouds, gallery controls, or other custom link groups.

### Navigation

- Keep the desktop navigation as a centered sticky glass bar with clear hierarchy.
- Navigation links should stay compact and readable. Active items may use a small soft capsule highlight, but avoid large button-like shapes.
- Mobile navigation should remain a top floating glass bar with a hamburger trigger and a clean full-screen overlay menu.
- Always verify both desktop and mobile navigation after changing header, menu, global link, or layout CSS.

### Tags And Categories

- Tags and categories should share the same visual language.
- Category lists should behave like tag clouds: horizontal first, then wrap vertically only when space runs out.
- Do not render categories as large cards, large pills, or heavy buttons unless specifically requested.
- Category/tag items should stay inline, colored, lightweight, and readable over wallpaper backgrounds.

### Gallery

- The gallery is photo-first. Do not let labels, copyright text, or controls overpower images.
- Copyright/ownership notices should be visible but quiet: short text, light glass treatment, subtle border, no heavy warning badge.
- Gallery cards may use image overlays and small index markers, but avoid bulky captions or UI chrome.
- Lightbox controls should remain minimal, high-contrast, and keyboard accessible.

### Wallpaper Behavior

- Do not change wallpaper on every page navigation, tag click, category click, or lightweight route change.
- Persist the current wallpaper in `localStorage` and reuse it across page loads.
- Wallpaper rotation should be infrequent and calm. Current target: about every 5 minutes.
- Preload the next wallpaper before applying it to avoid flicker, blank backgrounds, or perceived page jank.
- Changing theme mode may switch between light/dark wallpaper sets, but should not unnecessarily advance to the next wallpaper.

### Responsive Rules

- Every visual change must work at desktop width and mobile width.
- Prefer wrapping layouts over overflow. Horizontal content should wrap naturally instead of forcing scroll.
- Mobile spacing should be tighter but not cramped. Avoid huge fixed widths.
- Check narrow screens for background readability because wallpaper content can sit behind text.

### Dark Mode

- Any new visible component needs a dark-mode style when it uses borders, shadows, backgrounds, or custom text colors.
- Dark mode should feel soft and readable, not pure black with neon accents.

### Motion

- Use small, purposeful transitions only: opacity, transform, border, background, and shadow.
- Avoid animations that fire on every navigation or make the page feel like it is reloading.
- Do not animate wallpaper changes aggressively.

### Implementation

- Prefer editing existing theme files instead of adding new frameworks or dependencies.
- Keep CSS scoped to existing components where possible.
- Avoid broad global CSS changes unless necessary; global link and body rules can easily affect many pages.
- If changing generated behavior, update source files under `themes/hexo-theme-Klise-enhanced/`, then run Hexo generation.

### Verification

- Run `npx hexo generate` after frontend changes.
- For visual changes, verify at least:
  - Desktop page relevant to the change.
  - Mobile width around `390px`.
  - Dark mode if the changed component has custom color/background/border.
- If using browser automation, clean temporary Playwright artifacts before finishing.

