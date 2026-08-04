# Suite Dark

An unofficial, **Bitcoin-only, privacy-first** build of
[Trezor Suite](https://github.com/trezor/trezor-suite) desktop.

Suite Dark is a **fork** of Trezor Suite: the full upstream source pinned at a
specific commit, plus a small, readable set of commits that cut it down to Bitcoin
and turn privacy on by default. No shitcoins. No tracking. Tor by default. CoinJoin
enabled. Dark by default. **No compromise.**

> Website: <https://suite-dark.github.io/suite-dark/> · Desktop only.

## What's different from upstream

The entire delta is a handful of single-purpose commits on top of the upstream
snapshot — read them with `git log <snapshot>..HEAD` or on the
[commits page](https://github.com/suite-dark/suite-dark/commits/main):

| Commit | Effect |
|---|---|
| Branding | Product name / app id / URI scheme, Bitcoin-orange theme + tray icon. |
| Privacy — nothing phones home | No Sentry / analytics / auto-updater-telemetry; message-system local-only; re-texted consent; disabled Settings analytics toggle. |
| Privacy defaults | Tor and discreet mode on by default. |
| Bitcoin-only | Only BTC everywhere; removes the add-account network search and the MEV protection setting. |
| Hide Earn / Trading / promo | Removes the Earn & Trading surfaces and the dashboard promo banners. |
| CoinJoin | Default coordinator `coinjoin.kruw.io`; all "discontinued" messaging removed. |
| Passwords | Promotes the password manager to a first-class **Passwords** menu item. |
| Auto-update | From this repo's `continuous` release (Windows/Linux; macOS via a self-signed build — experimental). |
| Dark theme by default | Light / system still selectable in Settings. |

## Build it yourself

Prereqs: **Node 24**, **Yarn** (via corepack), git.

```bash
git clone --recurse-submodules https://github.com/suite-dark/suite-dark
cd suite-dark
yarn install
yarn build:libs
yarn build:essential          # signs the bundled message-system config (dev key, no secrets)
yarn workspace @trezor/suite-desktop build:mac   # or build:linux / build:win
# → packages/suite-desktop/build-electron/SuiteDark-*
```

Builds are **unsigned**, so macOS Gatekeeper / Windows SmartScreen warn on first
launch — expected for a build you verify yourself.

## Download

Prebuilt desktop binaries: **[Releases](https://github.com/suite-dark/suite-dark/releases)**
(rolling `continuous` tag). Verify your download against `SHA256SUMS`.

## Tracking upstream

Suite Dark pins an upstream snapshot (see the `Import trezor-suite …` commit) and
carries its changes as commits on top. To move onto a newer upstream release,
re-import the snapshot and rebase the Suite Dark commits onto it — the delta stays
small and explicit.

## CI

`.github/workflows/build.yml` is a manual (`workflow_dispatch`) matrix build for
macOS / Linux / Windows that publishes to the `continuous` release. `pages.yml`
publishes `site/` to GitHub Pages. (Upstream's workflows are intentionally removed.)

---

Suite Dark is an **unofficial, community-built** distribution. It is **not**
affiliated with, endorsed by, or supported by SatoshiLabs / Trezor. "Trezor" and
"Trezor Suite" are trademarks of their respective owners. Provided as-is, no
warranty. Always verify what you run.
