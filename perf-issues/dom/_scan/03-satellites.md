# V3 — connect-explorer(-theme), analytics-docs, suite-web bootstrap, env-utils (verified by reading)

Verified at branch `issues/perf-performance-dom` @ `1eacf16b1d`. All three finding-sites live in
the **connect-explorer docs theme** (forked Nextra) — a docs site, not the wallet — so every one
is P3 and they should ship as one batch document.

## Findings

### F-10 · P3 · BackToTop reads scrollTop in a scroll listener; an IntersectionObserver sentinel is free

`packages/connect-explorer-theme/src/components/back-to-top.tsx:13-24` — a `scroll` listener
reads `document.documentElement.scrollTop` and `classList.toggle`s opacity per event. The read is
cheap while scrolling (layout stays clean) and the toggle only mutates on the 300 px boundary
cross, so today's cost is one listener invocation per scroll event plus one forced layout right
after each cross. The conforming tool is an `IntersectionObserver` on a 300 px-tall sentinel (or
the page top): zero main-thread work per scroll event — `useAnchor.ts:25` is the in-repo worked
example. Note the listener is also non-passive (no `{ passive: true }`).

### F-11 · P3 · Sidebar reads `window.innerWidth` in the render body to duplicate a CSS media query

`packages/connect-explorer-theme/src/components/sidebar.tsx:168` —
`{mounted && window.innerWidth < 768 && (<Menu className="nextra-menu-mobile md:nx-hidden" ...>)}`.
A window-geometry read in the render body, re-evaluated on every sidebar render — and it
duplicates the `md:nx-hidden` class already on the element. Beyond the read, it is non-reactive:
resizing across 768 px doesn't re-render, so the JS half and the CSS half can disagree until the
next unrelated render. Fix: drop the JS check and let the media-query class decide (or a
`matchMedia` listener if mount cost of `Menu` matters).

### F-12 · P3 · Search results overlay transitions `max-height`

`packages/connect-explorer-theme/src/components/search.tsx:293-295` — inline
`style={{ transition: 'max-height .2s ease' }}` on the results `<ul>` (the comment says
tailwind couldn't express it). Every open/resize of the results list animates a layout property —
style + layout of the overlay subtree per frame for 0.2 s. Overlay is small and the site is docs,
hence P3; the compositor-friendly shape is animating `transform`/`opacity` on a clipped
container, or simply dropping the transition.

## Checked, clean (do not re-scan)

| Site | Verdict |
| --- | --- |
| `connect-explorer-theme/src/components/sidebar.tsx:66-82` | Route-change effect: querySelector + one `window.innerWidth` read + one `scrollIntoView` per navigation — event-driven one-off. (The `setTimeout(scroll, 300)` waiting out the menu transition would be cleaner as a `transitionend` listener; note only.) |
| `connect-explorer-theme/src/components/toc.tsx:42-55` | `scrollIntoView` once per active-anchor change; the anchor state itself comes from an IntersectionObserver (`contexts/active-anchor.tsx:35`) — batched, not per-frame. |
| `connect-explorer-theme/src/polyfill.ts:6-14` | Resize listener toggling a body class with a 200 ms quiet timer — idempotent adds, one mutation per resize burst. |
| `connect-explorer-theme/src/components/back-to-top.tsx:7-9` | `window.scrollTo` on click — user action, one-off. |
| `connect-explorer/src/components/ConnectInitForm.tsx:120-123`, `:159`, `Method.tsx:203` | background/border-color/color/opacity — paint-only, named. |
| `connect-explorer-theme` Tailwind `nx-transition-colors` / `nx-transition-opacity` / `nx-transition-transform` classes (sidebar/menu/navbar/search/breadcrumb/theme-switch/mdx-components) | Paint/compositor properties by class definition. `sidebar.tsx:125` `nx-transition-all` sits on the vendored theme's mobile drawer (transform-driven, `nx-transform-gpu`); vendored CSS is exempt per PROGRESS scope. |
| `analytics-docs/src/App.tsx:61-71` | rAF used to coalesce sidebar-drag pointermoves into one state update per frame — no geometry read/write inside; same legitimate shape as `ResizableBox.tsx:347`. |
| `analytics-docs/src/App.tsx:152-166` | Double-rAF + bounded `setTimeout` retry to scroll to the URL hash once async content exists — one-shot page-load routine in an internal tool. |
| `analytics-docs/src/app/scroll.ts:8-23` | **Exemplary**: both `getBoundingClientRect`s and `scrollTop` read together, then a single `scrollTo` write — "take every read you need, then write" verbatim. |
| `analytics-docs/src/app/layout.tsx:59` | border-color transition — paint-only. |
| `packages/suite-web/src/index.ts:7-20`, `static/vite-index.ts:5` | Bootstrap MutationObserver, disconnects on first match (already in V2 ledger). |
| `packages/connect-examples/webextension/src/connect-manager.ts` (innerText writes) | Sample-code package, out of scope per PROGRESS. |

## Excluded here (already filed)

`connect-explorer-theme/src/components/collapse.tsx:37-40` → #31134 (the sidebar comment at
`:154` documents that fix's constraint).
