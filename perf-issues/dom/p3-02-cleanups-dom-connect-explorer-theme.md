DOM cleanups: connect-explorer docs theme (scroll listener, render-body geometry read, `max-height` transition)

Extracted from the `skills/performance-dom/SKILL.md` audit — both sections. All three sites live
in `packages/connect-explorer-theme`, the forked Nextra theme behind the Connect docs site — not
the wallet — hence one batch issue at P3. Precedent for fixing this package:
[#31134](https://github.com/trezor/trezor-suite/issues/31134) (its `collapse.tsx`). **One issue,
one PR.**

## 1. BackToTop polls scrollTop in a scroll listener; an IntersectionObserver sentinel is free

[`packages/connect-explorer-theme/src/components/back-to-top.tsx:13-24`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-explorer-theme/src/components/back-to-top.tsx#L13-L24)

### Before

```tsx
useEffect(() => {
    function toggleVisible() {
        const { scrollTop } = document.documentElement;
        ref.current?.classList.toggle('nx-opacity-0', scrollTop < 300);
    }

    window.addEventListener('scroll', toggleVisible);

    return () => {
        window.removeEventListener('scroll', toggleVisible);
    };
}, []);
```

### After

Observe a sentinel spanning the top 300 px of the document (or the page header) and toggle the
class in the observer callback — zero main-thread work per scroll event, reads delivered
post-layout. [`suite/router/src/useAnchor.ts:25`](https://github.com/trezor/trezor-suite/blob/develop/suite/router/src/useAnchor.ts#L25)
is the in-repo worked example. If the listener stays for any reason, it should at least be
`{ passive: true }`.

### Why it matters

The handler runs on every scroll event; the read is cheap while layout is clean, but the
`classList.toggle` right after it means the first event after each 300 px boundary cross pays a
forced layout, and the listener itself is per-event main-thread work the observer does for free.

## 2. Sidebar reads `window.innerWidth` in the render body to duplicate a CSS media query

[`packages/connect-explorer-theme/src/components/sidebar.tsx:168`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-explorer-theme/src/components/sidebar.tsx#L168)

### Before

```tsx
{mounted && window.innerWidth < 768 && (
    <Menu
        className="nextra-menu-mobile md:nx-hidden"
        ...
```

### After

Let the `md:nx-hidden` class that is already on the element decide — render the menu whenever
`mounted` and let CSS hide it ≥ 768 px; or, if mounting `Menu` off-screen is too heavy, gate on a
`matchMedia('(max-width: 767px)')` subscription so the value is reactive and read outside render.

### Why it matters

A window-geometry read in the render body re-runs on every sidebar render, and it duplicates a
decision CSS is already making on the same node — with the JS half frozen at render time: resize
across 768 px and the two halves disagree until the next unrelated render. The same file reads
`window.innerWidth` again at `:69` inside a route-change effect (one-off, fine) — the render-body
read is the one that violates the rule.

## 3. Search results overlay transitions `max-height`

[`packages/connect-explorer-theme/src/components/search.tsx:293-295`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-explorer-theme/src/components/search.tsx#L293-L295)

### Before

```tsx
style={{
    transition: 'max-height .2s ease', // don't work with tailwindcss
}}
```

### After

Drop the transition (results snap — standard for search overlays), or animate the overlay's
entrance with `transform`/`opacity` on a clipped container as its `Transition` wrapper already
does for opacity (`:276`).

### Why it matters

`max-height` is a layout property: every open/close/resize of the results list animates style +
layout of the overlay subtree per frame for 0.2 s. The inline comment records that Tailwind
couldn't express it — which is the moment the property choice should have been reconsidered
rather than inlined.

## Notes

- The theme is vendored-*ish* (forked Nextra): upstream drift is a real review consideration, but
  #31134 set the precedent that this package's defects get fixed in-repo.
- Everything else scanned in this package is clean or exempt — the drawer's `nx-transition-all`
  rides on vendored CSS, `toc.tsx`/`sidebar.tsx` scrolls are one-off per navigation, and
  `polyfill.ts`'s resize class-toggle is idempotent per burst (full ledger:
  [`_scan/03-satellites.md`](_scan/03-satellites.md)).

<sub>Verified against `issues/perf-performance-dom` at `1eacf16b1d`. Part of #28886, belongs under #30497.</sub>
