## In-app-browser host module (debug-only)

Owns a single `WebContentsView` that renders an external site "inside" the Suite window.
The view is a native layer painted above the window's web contents and ignores DOM z-index,
so the renderer measures a placeholder rect and drives position and visibility over IPC.

That placeholder is a full-bleed region rather than a node in page flow,
which is what makes the arrangement tenable: the region fills the content area and never scrolls,
so a single `ResizeObserver` in the renderer sees every layout change that reaches it.

The view never runs in Suite's own session:

- Either it gets the shared in-memory partition, which is the default and forgets everything when the app closes,
- Or — for a catalog entry that asks for it — a session of its own on disk under `<userData>/in-app-browser/<entry id>`, one directory per
  entry so entries cannot read each other's cookies. Which one an entry gets is decided here from the catalog, never from the renderer's word.

Either way the request-filter and response-headers modules (both bound to the default session) do
not apply to the embedded page, so no allowlist or CSP changes are needed for the showcase — and
neither does Tor's proxy, which is worth weighing before marking an entry persistent: a durable
clear-net cookie jar is re-sent on the next launch even if Tor is switched on in between.

### Persistent sessions on disk

- An entry with `persistSession` gets `session.fromPath(<userData>/in-app-browser/<entry id>, { cache: true })`.
- `userData` is Electron's per-app directory named:
    - `@trezor/suite-desktop` for codesigned builds
    - `@trezor/suite-desktop-dev` for other builds
    - `@trezor/suite-desktop-local` in development (see `libs/user-data.ts`),
- and based on platform:
    - MacOS: `~/Library/Application Support`
    - Windows: `%APPDATA%`
    - Linux: `~/.config`
- Chromium keeps a whole profile in that directory: `Cookies`, `Local Storage/`, `Session Storage/`, `IndexedDB/`, `Service Worker/`, `File System/`, `Cache/`, `Code Cache/`, the GPU shader caches, `WebStorage/` (the quota database), `Network Persistent State`, `TransportSecurity`, `Trust Tokens`, `DIPS` (bounce-tracking records), the privacy-sandbox databases and `Preferences`.
- Several of them name the visited origins in **plain text** (the IndexedDB directory names, the quota database, the HTTP/2 server list in `Network Persistent State`) and only cookie values are encrypted, through the OS keychain.
- Every other entry, and every custom URL, opens in the shared partition
  `fromPartition('in-app-browser')`. Without a `persist:` prefix Chromium treats it as off-the-record: cookies, DOM storage, IndexedDB, caches and service workers live in RAM and vanish with the process, no directory is created for it under `userData`, and Electron reports that as `storagePath === null`. A page loaded into it during the check left no trace on disk.
- `in-app-browser/clear-data` closes the session's connections and then runs `clearData()`, `clearAuthCache()`, `clearCache()` and a cookie flush.
    - `clearData()` without options asks Chromium's `BrowsingDataRemover` for every data type it knows and Electron installs no embedder delegate, so nothing outside Chromium's own stores is touched.
    - Checked with Electron 43.2.0: the cookie rows are overwritten rather than merely unlinked, the origin-named IndexedDB directory is deleted, OPFS files, CacheStorage entries and worker scripts are removed, the HTTP and code caches are emptied, the quota database loses its rows, and a page opened afterwards reads nothing. HSTS and the server list in `Network Persistent State` fall under the same call's networking-history sweep, which that check could not exercise without a real network.

What the clear leaves behind:

- `Preferences`, Chromium does not count it as browsing data (e.g. zoom levels, spellcheck dictionary).
- LevelDB tombstones. `Local Storage`, `Session Storage`, `Service Worker/Database` and `File System/Origins` are append-only logs: after the clear the old keys, values and origins are still in the files behind deletion markers until LevelDB compacts, which for stores this small may be never. A page cannot read them; a look at the disk can.
- The directory itself. Electron caches one `Session` per path, freezes its options at first use and offers no way to destroy it, so the files stay open for the rest of the run, and the clear even
  creates a few empty databases that were not there before. The tree is only reclaimed by Suite's
  debug "Wipe data", which removes everything under `userData` — the reason these directories live there.

#### Navigation allowlists

The page is contained by two separate allowlists, both supplied by the caller and both reported to the renderer when they refuse something:

- `redirectExternalOrigins` governs `will-navigate` and `will-redirect` — where the page may go,
  on top of the origin it was opened with, whether it navigates there itself or a server answers
  with a redirect there; the opening load's redirects are held to the same list.
    - A refused redirect cancels the whole navigation: the page stays on its current document, or —
      on the opening load — never appears, which is then also reported as a failed load.
    - A custom URL in the showcase declares nothing, so it has to be the final URL: a cross-origin
      redirect on open is refused.
- `popupExternalOrigins` governs `setWindowOpenHandler` — which origins may get a window of
  their own. A popup is the only way a third-party flow can keep the `window.opener` channel it
  uses to hand a result back, which a top-level redirect cannot do.
    - A permitted popup is registered like the view itself, so the global navigation lock in `createDesktopMainApp.ts` defers to the guard installed here rather than blocking the popup outright;
    - it may move between the origins of both lists, cannot open further windows, and is destroyed with the view.
    - It also shares the view's session — including a persistent one — which Electron gives no way to change.

**The page has no preload, no node integration, and no access to Suite IPC.**

### HTTP authentication

A server answering with `401` and `WWW-Authenticate: Basic` makes the view's `WebContents` emit
`login`. Left alone, Electron cancels the challenge and the page shows the server's 401 body — which
is what this module does for everything it refuses. What it puts to the user goes through the rules
of `services/httpAuth.ts`, in this order, each refusal logged and reported to the renderer as
`http-auth-refused` with the origin and the rule:

- no proxy challenges (Suite has no authenticating proxy; Tor is SOCKS without credentials);
- only the `basic` scheme (no digest, NTLM or Negotiate);
- only over `https`, and only from a parsable url;
- only from the main frame and only for a navigation — both flags are undocumented fields of the
  event's details, read fail-closed, because a cross-origin iframe or a `credentials: 'include'`
  fetch raises `login` too and would otherwise draw a third party's prompt under the site's origin;
- only from the origin the view was opened with;
- only one challenge at a time;
- at most three prompts per navigation: wrong credentials re-fire `login` for the same navigation
  and Chromium never gives up on its own, so the host counts and a new navigation resets.

An accepted challenge is held open with a synchronous `preventDefault()` — one behind an await is
too late — and relayed as `http-auth-requested` with a `requestId` the host generated, the origin
(never the url, which may name a path) and the realm cut to 200 characters, the server's own text to
be rendered as text. The renderer draws the prompt and answers over `in-app-browser/http-auth-response`
with that id and either the credentials or `null`; the id is looked up in the pending registry and an
unknown or already settled one is dropped. Nothing in Electron says that a challenge died when the
navigation is superseded or the view goes away, so the host cancels every pending challenge and sends
`http-auth-dismissed` when a new main-frame navigation starts (`did-start-navigation`, before the new
navigation's own `login` fires, which would otherwise be refused as "already pending"), on the commit
(`did-navigate`) and in `closeView` — which also runs on quit, on the window being destroyed and on a
renderer reload. A wrong answer restarts the request, not the navigation, so neither event fires
between the retries and the per-navigation cap holds.

Popups refuse every challenge (a popup's `login` fires on the popup's own `WebContents`): no showcase
flow needs a popup to authenticate.

After a successful answer the session's HTTP auth cache answers same-realm requests silently. The
shared in-memory partition is one session for every non-persistent entry and every custom url, so
`closeView` clears that cache: credentials entered for one entry would otherwise be replayed to that
origin for requests another entry's page issues. The cache is in memory only, so a persistent entry
re-prompts after a restart anyway.

The credentials are handed to Electron's callback and to nothing else — not logged, not put into an
event, not persisted by this module. A url that carries `user:pass@` is refused on open, reported
under its origin, and an unparsable url is not logged at all for the same reason.
