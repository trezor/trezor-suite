## In-app-browser host module (debug-only)

Owns a single `WebContentsView` that renders an external site "inside" the Suite window.
The view is a native layer painted above the window's web contents and ignores DOM z-index,
so the renderer measures a placeholder rect and drives position and visibility over IPC.

That placeholder is a full-bleed region rather than a node in page flow,
which is what makes the arrangement tenable: the region fills the content area and never scrolls,
so a single `ResizeObserver` in the renderer sees every layout change that reaches it.

The view never runs in Suite's own session:

- Either it gets the shared in-memory partition, which is the default and forgets everything when the app closes,
- Or — for a catalog entry that asks for it — a session of its own on disk under `<userData>/embedded-apps/<entry id>`, one directory per
  entry so entries cannot read each other's cookies. Which one an entry gets is decided here from the catalog, never from the renderer's word.

Either way the request-filter and response-headers modules (both bound to the default session) do
not apply to the embedded page, so no allowlist or CSP changes are needed for the showcase — and
neither does Tor's proxy, which is worth weighing before marking an entry persistent: a durable
clear-net cookie jar is re-sent on the next launch even if Tor is switched on in between.

A persistent session cannot be undone from inside the process:

- Electron caches one Session per path, freezes its options at first use and offers no way to destroy it, so the directory stays
  open for the rest of the run.
- `in-app-browser/clear-data` therefore empties the session through Chromium rather than deleting the tree; the tree itself is only reclaimed by Suite's own "clear app data", which sweeps everything under `userData` — the reason these directories live
  there.

The page is contained by two separate allowlists, both supplied by the caller and both reported
to the renderer when they refuse something:

- `redirectExternalOrigins` governs `will-navigate` — where the page itself may go, on top of
  the origin it was opened with.
- `popupExternalOrigins` governs `setWindowOpenHandler` — which origins may get a window of
  their own. A popup is the only way a third-party flow can keep the `window.opener` channel it
  uses to hand a result back, which a top-level redirect cannot do.
    - A permitted popup is registered like the view itself, so the global navigation lock in `app.ts` defers to the guard installed here rather than blocking the popup outright;
    - it may move between the origins of both lists, cannot open further windows, and is destroyed with the view.
    - It also shares the view's session — including a persistent one — which Electron gives no way to change.

**The page has no preload, no node integration, and no access to Suite IPC.**
