# Research: serving the desktop renderer from a local HTTP server to get WebAuthn

Status: research, no decision. Written on 2026-11-10 against `develop` at `1a0da3cc78`.

## Question

What would it take to serve the packaged Trezor Suite desktop renderer from an HTTP server running in
the Electron main process, so that `navigator.credentials` (WebAuthn) works on Windows, macOS and
Linux the way it does in the Bitwarden desktop app?

The motivation is `PlatformEncryption` (`suite-common/platform-encryption`), the service that
encrypts the Suite Sync owner key and the delegated identity key at rest. Desktop implements it with
Electron `safeStorage`; web has a WebAuthn placeholder
(`suite/platform-encryption-webauthn`) that always returns `EncryptionUnavailable`. A WebAuthn
implementation would need the `prf` extension (CTAP `hmac-secret`) to derive a key from an
authenticator, so "WebAuthn works" below always means "a PRF-capable ceremony completes".

## How the desktop renderer is loaded today

| Concern                 | Current state                                                                                                                                                                              | Where                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| Production load         | `mainWindow.loadFile('build/index.html')`, so the document origin is `file://`                                                                                                             | `suite-app/desktop-app-main/src/libs/loadIndex.ts`              |
| Development load        | `loadURL('http://localhost:8000/')` with `webSecurity: false`                                                                                                                              | same file, `createMainWindow.ts`                                |
| Renderer isolation      | `sandbox`, `contextIsolation`, no node integration, preload exposes `desktopApi`                                                                                                           | `createMainWindow.ts`                                           |
| CSP and Document-Policy | injected with `session.webRequest.onHeadersReceived` for every response, production only                                                                                                   | `modules/response-headers.ts`                                   |
| Outbound allowlist      | renderer requests are cancelled unless the host is in `allowedDomains`; `localhost` and `127.0.0.1` are allowed                                                                            | `modules/request-filter.ts`, `config.ts`                        |
| Origin header           | requests from a `file:` frame to localhost get `Origin: https://electron.trezor.io`, because `file:` sends none; Bridge and the Bluetooth process rely on that origin                      | `libs/create-electron-session-interceptor.ts`                   |
| Router                  | `createMemoryHistory`, so no dependency on the URL                                                                                                                                         | `desktop-app-renderer/src/createSuiteDesktopCompositionRoot.ts` |
| Persistent data         | IndexedDB (`packages/suite/src/storage`, `idb`) and `localStorage` live under the `file://` origin                                                                                         | renderer                                                        |
| Local HTTP server       | `HttpServer` from `@trezor/node-utils` on `127.0.0.1:21335` for OAuth callbacks, trading redirects, `/status`, `/connect-ws` and the MCP server; it has routing but no static file serving | `libs/http-receiver.ts`, `modules/http-receiver.ts`             |
| Tor                     | `session.defaultSession.setProxy({ proxyRules })` with no bypass list                                                                                                                      | `modules/tor.ts`                                                |
| E2E                     | the desktop Playwright helper hardcodes `file:///` as the app URL                                                                                                                          | `suite/e2e/support/common.ts`                                   |

## Why WebAuthn does not work from `file://`

Chromium only lets an origin claim a relying party ID when the origin is `https` or an `http`
origin under `localhost`. A `file://` document, and a custom scheme registered as `secure` and
`standard`, report `isSecureContext === true` and still fail with "Public-key credentials are only
available to HTTPS origin or HTTP origins that fall under 'localhost'". Electron maintainers say that
changing this would mean patching Chromium
([electron#24573](https://github.com/electron/electron/issues/24573),
[chromium 40140414](https://issues.chromium.org/issues/40140414)). Serving the renderer from
`http://localhost:<port>` therefore does unblock the API call. The rest of this document is about
what that costs and what it does not buy.

## What Bitwarden actually does

Bitwarden's desktop app is not served from localhost. Its renderer is loaded through a custom
`bw-desktop-file://` scheme (`apps/desktop/src/main/window.main.ts`). The WebAuthn two-factor
ceremony runs in a cross-origin iframe pointing at the hosted web vault,
`https://vault.bitwarden.com/webauthn-connector.html`, with
`iframe.allow = "publickey-credentials-get <vault origin>"`; the result comes back with
`postMessage` (`libs/common/src/auth/webauthn-iframe.ts`). The desktop client uses the iframe
path; only the browser extension opens the connector in a new tab and returns through a
`bitwarden://webauthn-callback` deep link. The relying party ID is therefore `bitwarden.com`, the
same credentials work in the web vault, and Chromium does the ceremony on a real `https` origin.

For passkey login with PRF, Bitwarden concluded that Electron's built-in WebAuthn is not enough
("Electron does not support PRF unlock and has no plans to do so") and prototyped routing
`navigator.credentials` through `desktop_native`, a Rust module using the `ctap-hid-fido2` crate for
security keys, with Windows and macOS native APIs planned
([bitwarden/clients#17420](https://github.com/bitwarden/clients/pull/17420), proof of concept,
closed unmerged). Bitwarden also ships a Rust wrapper of the Windows `webauthn.dll`
(`apps/desktop/desktop_native/win_webauthn`), but for acting as a passkey provider, not as a client.

So the thing to copy from Bitwarden is the `https` connector iframe, not a localhost server.

## What Electron 44/45 gives you once the origin is acceptable

Suite ships Electron 44.9.3. The state of WebAuthn there, per
[electron#24573](https://github.com/electron/electron/issues/24573),
[electron#27355](https://github.com/electron/electron/issues/27355) and the
[`app.configureWebAuthn` docs](https://www.electronjs.org/docs/latest/api/app):

| Platform | USB security key                                                                                              | Platform authenticator                                                                                          | PRF                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Windows  | works through Chromium's `webauthn.dll` path, with the native dialog                                          | Windows Hello through the same dialog; reports in Electron 44 say only roaming keys are offered, to be verified | depends on Windows 11 `webauthn.dll` support, to be verified                                                     |
| macOS    | no prompt is shown (#27355, closed "not planned"); the key may still respond to touch; PIN entry is not wired | none in 44; Electron 45 adds `app.configureWebAuthn({ touchID, platformPasskeys })`, macOS only                 | not supported by either macOS authenticator in Electron 45 ("`prf` and `largeBlob` are not currently supported") |
| Linux    | works for USB keys; no popup, no PIN entry, no hybrid/BLE (petfold, Electron 44.7.0, Oct 2026)                | none                                                                                                            | USB key `hmac-secret` through Chromium, expected to work, to be verified                                         |

Two constraints matter for the localhost idea specifically:

- Electron 45 platform passkeys on macOS require an Associated Domains entitlement, an
  `apple-app-site-association` file served over `https` and a provisioning profile. The docs are
  explicit that there is "no `localhost` rpId workaround". Any native macOS path has the same rule:
  the [vault12/electron-webauthn-mac](https://github.com/vault12/electron-webauthn-mac) addon
  states "domain association is always required, even for local testing".
- Platform passkeys "cannot serve cross-origin (iframe) requests", so the Bitwarden iframe pattern
  would not reach iCloud Keychain passkeys on macOS either; Touch ID credentials do support iframes.

In short, a localhost origin gets you USB security keys with Chromium's partial UI on Windows and
Linux, and nothing new on macOS.

## Option A: serve `build/` from the main process over `http://localhost`

This is the proposal in the question. Work items, roughly in dependency order.

1. **Static file serving.** `HttpServer` in `@trezor/node-utils` routes by path and has no static
   handler. Add one that serves `build/` from inside the asar with path normalisation (reject `..`
   and absolute paths), a MIME map, `Cache-Control: no-store` and the CSP from `response-headers`.
   Express would do the same with one more dependency in the main process and the audit that
   comes with it; a small handler on the existing server is closer to the repository's habits.
2. **A dedicated, fixed port.** The origin includes the port, and IndexedDB, `localStorage` and
   any WebAuthn credential are bound to the origin, so the port must be stable across launches. The
   receiver on 21335 already falls back on collision, which is exactly what the app origin cannot
   do. A second server on its own port with a hard failure (or a stored port plus migration) is
   needed. The relying party ID is the host only, so credentials survive a port change but storage
   does not.
3. **Host name.** Chromium's rule is "origins that fall under localhost". Use `http://localhost`
   rather than `http://127.0.0.1` so the relying party ID is a name, bind the server on both
   `127.0.0.1` and `::1`, and verify in the spike that Chromium's internal localhost resolution
   reaches the server when the OS resolves `localhost` to `::1` first.
4. **Keep other local processes out.** Every local process can open `http://localhost:<port>`.
   The bundle is public anyway, but a stable local origin is a new surface: issue a random
   per-launch token, set it as a cookie on the origin from the main process before `loadURL`, and
   refuse requests without it. Also reject requests whose `Host` is not the expected one, which
   blocks DNS rebinding.
5. **Storage migration.** Nothing in Electron moves IndexedDB between origins. On first start at
   the new origin, open a hidden `BrowserWindow` on the old `file://` index with a preload that
   exports the `SuiteDB` stores and `localStorage`, hand the data to the main process over IPC,
   import it at the new origin, then clear the old origin. This is the largest item and the one
   with user-visible failure modes (loss of labels, settings, discovery cache). The existing
   migration framework in `suite/idb-migration-utils` works within one origin and does not help.
6. **Origin header rewrite.** `create-electron-session-interceptor.ts` adds
   `Origin: https://electron.trezor.io` only for frames whose URL starts with `file:`. With an
   `http://localhost` frame the renderer sends `Origin: http://localhost:<port>` to Bridge,
   `/connect-ws` and the Bluetooth process. Either extend the condition to the new frame origin or
   confirm those services accept the new value; today the condition would silently stop matching.
7. **Tor.** `setProxy({ proxyRules })` has no bypass list, so with Tor on, the renderer's requests
   to its own origin would go to the SOCKS proxy. Add `proxyBypassRules: '<-loopback>'` or the
   explicit host, and check the in-app browser session, which has its own proxy handling.
8. **Response headers and CSP.** `onHeadersReceived` still applies, and `default-src 'self'` now
   means the localhost origin, which is what is wanted. The server can also set the headers itself,
   which would make `response-headers` redundant for the main document.
9. **Load path and dev mode.** Replace `loadFile` with `loadURL('http://localhost:<port>/')`.
   Development already runs on `http://localhost:8000`, so WebAuthn can be tried in dev today, which
   is the cheapest first experiment.
10. **E2E and tooling.** `suite/e2e/support/common.ts` assumes `file:///`; the Electron Playwright
    helpers and any `webContents.getURL()` checks in main (`isMainWindowUsable`, external-link
    guards, event logging) need the new origin. Sentry release tagging is unaffected.
11. **Verify the gain.** With the origin fixed, run `navigator.credentials.create({ publicKey:
{ rp: { id: 'localhost' }, extensions: { prf: {} } } })` and a `get` with `prf.eval` on all
    three OSes with a YubiKey 5 and with Windows Hello. The table above predicts: Windows and Linux
    keys yes, macOS keys without UI, platform authenticators no.

Security property to weigh before building any of it: credentials created for relying party ID
`localhost` are claimable by any page on any port of localhost, which includes every local
development server and any malicious local process that can open a browser window. The user sees a
prompt that names "localhost". For a PRF-derived key that protects the Suite Sync owner key, this
means any local page can ask the authenticator for the same secret, gated only by a user touch on a
prompt that does not identify Suite. That is a weaker binding than `safeStorage` provides today.

Rough size: items 1, 2, 4, 6, 7, 8, 9 are each small; item 5 is a medium feature with its own
testing matrix; item 10 is medium across E2E; item 11 is a one-day spike per OS. The spike should
come first, because its result decides whether anything else is worth doing.

## Option B: the Bitwarden pattern, an `https` connector page in an iframe

Keep `file://` (or move to a custom scheme later). Host a static `webauthn-connector.html` on a
Trezor domain, embed it in the renderer in an iframe with
`allow="publickey-credentials-get; publickey-credentials-create"`, pass the request as a query or
`postMessage`, and receive the result by `postMessage` with origin checks.

- Relying party ID becomes the Trezor domain. The same credential works in web Suite, which is
  either a feature (one PRF key for the user's account on both platforms) or a risk (web Suite
  phishing surface now covers desktop credentials); this needs a product decision.
- Chromium performs the ceremony on a real `https` origin, so the OS-level support is the same as
  in Option A: USB keys on Windows and Linux, Windows Hello on Windows, nothing on macOS until
  Electron 45 Touch ID (which works in iframes) or a native addon. macOS platform passkeys do not
  serve iframes.
- Needs network and the hosted page; does not work offline or in offline mode, and with Tor the
  frame loads through Tor. `request-filter` already allows `trezor.io`; CSP needs
  `frame-src https://<host>`; `setWindowOpenHandler` and the in-app browser must not treat the
  frame as external content.
- No storage migration, no new local server, no origin-dependent behaviour anywhere else.

A variant with the same hosting is the system browser fallback: open the connector in the default
browser and return through the existing `trezorsuite://` deep link, which is what Bitwarden's
browser extension does. It gets the full WebAuthn stack of the user's browser (passkeys, Touch ID,
Windows Hello, PRF in Chrome) on all platforms, at the cost of a context switch and of trusting the
deep-link return path, which `http-receiver` and the trading redirects already use.

## Option C: native authenticator access, no `navigator.credentials`

Implement the CTAP2 ceremony with `hmac-secret` in a native module and expose it through
`desktopApi`, the way Bitwarden's proof of concept does with `ctap-hid-fido2`. Suite already builds
`suite/desktop-app-native-bindings`. This is the only route to a Suite-specific relying party ID
without a hosted page, to PIN and touch prompts drawn by Suite, and to the same behaviour on all
three OSes for USB keys. Platform authenticators still need the OS APIs: `webauthn.dll` on Windows,
AuthenticationServices on macOS with associated domains, nothing stable on Linux. This is the most
work and the most review, and it is what both Bitwarden and the macOS addon landed on when they
needed PRF.

## Comparison

|                                   | A: localhost server                                                      | B: https connector iframe                        | C: native CTAP                                                                   |
| --------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| Unblocks `navigator.credentials`  | yes                                                                      | yes                                              | not needed                                                                       |
| Relying party ID                  | `localhost`, shared with every local page                                | Trezor domain, shared with web Suite             | Suite's choice                                                                   |
| USB key with PRF on Windows/Linux | expected                                                                 | expected                                         | yes                                                                              |
| macOS                             | no prompt in Electron 44; Touch ID only from Electron 45 and without PRF | same, Touch ID works in iframes, passkeys do not | AuthenticationServices needs associated domains; `hmac-secret` over USB possible |
| Works offline                     | yes                                                                      | no                                               | yes                                                                              |
| Storage migration                 | required                                                                 | no                                               | no                                                                               |
| New attack surface                | stable local HTTP origin                                                 | hosted page inside the wallet UI                 | native code                                                                      |
| Effort                            | medium, dominated by migration and the origin checks                     | small to medium                                  | large                                                                            |

## Recommendation for the next step

1. Spend one day in development mode, where the renderer already runs on `http://localhost:8000`,
   and run the create/get ceremony with `prf` on Windows, macOS and Linux with a YubiKey and the
   platform authenticator. Record what prompts appear and whether `prf.results` comes back. This
   measures Option A's ceiling without writing any of it.
2. If PRF comes back on Windows and Linux only, Option A does not deliver "across the platforms".
   The remaining choices are B for a quick cross-platform result that depends on a hosted page, or
   C for the full result. Upgrading to Electron 45 is a prerequisite for anything on macOS and
   should be scheduled regardless.
3. Decide the relying party question (per-device Suite credential vs. one shared with web Suite)
   with product and security before choosing between B and C, because it fixes the origin story and
   the recovery story for the encrypted keys.

## Sources

- Electron: [WebAuthn FIDO/FIDO2 support, #24573](https://github.com/electron/electron/issues/24573),
  [WebAuthn prompt on macOS, #27355](https://github.com/electron/electron/issues/27355),
  [`app.configureWebAuthn` docs](https://www.electronjs.org/docs/latest/api/app),
  [Electron 45 release notes](https://www.electronjs.org/blog/electron-45-0),
  [macOS passkeys PR #51563](https://github.com/electron/electron/pull/51563),
  [Electron security guide](https://www.electronjs.org/docs/latest/tutorial/security).
- Chromium: [WebAuthn fails in secure context in Electron app, 40140414](https://issues.chromium.org/issues/40140414),
  [Intent to ship: WebAuthn PRF extension](https://groups.google.com/a/chromium.org/g/blink-dev/c/iTNOgLwD2bI).
- Bitwarden: `apps/desktop/src/main/window.main.ts`, `libs/common/src/auth/webauthn-iframe.ts`,
  `apps/web/src/connectors/webauthn.ts`, `apps/desktop/desktop_native/win_webauthn/README.md` in
  [bitwarden/clients](https://github.com/bitwarden/clients);
  [PRF passkey login PoC #17420](https://github.com/bitwarden/clients/pull/17420);
  [FIDO2 support for macOS and Linux desktop client, community thread](https://community.bitwarden.com/t/fido2-support-for-macos-and-linux-desktop-client/11867/79);
  [Login with passkeys, help](https://bitwarden.com/help/login-with-passkeys/).
- Native addons: [vault12/electron-webauthn-mac](https://github.com/vault12/electron-webauthn-mac),
  [iamEvanYT/electron-webauthn](https://github.com/iamEvanYT/electron-webauthn).
- Yubico: [CTAP2 hmac-secret deep dive](https://developers.yubico.com/WebAuthn/Concepts/PRF_Extension/CTAP2_HMAC_Secret_Deep_Dive.html).
