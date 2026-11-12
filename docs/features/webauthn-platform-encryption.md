# WebAuthn platform encryption

Status and remaining work for encrypting local data with a key derived from a passkey, on web and
desktop. The code is on the `feat/desktop-renderer-over-localhost` branch.

## How it works

A passkey with the WebAuthn [PRF extension](https://w3c.github.io/webauthn/#prf-extension) returns
the same 32-byte secret every time it is asked with the same input. Suite uses that secret as the
root of its `PlatformEncryption` service:

1. On the first encryption, Suite creates a passkey and stores its credential ID in `localStorage`.
2. Suite asks the passkey for its PRF output with a fixed input
   (`trezor-suite/platform-encryption/v1`). The result is imported as a non-extractable HKDF key and
   kept in memory for the session, so the passkey prompt appears once per session.
3. Every message gets its own AES-GCM-256 key, derived from the root key and a random 32-byte salt.
   The ciphertext is `hex(salt || iv || ciphertext)`.

The same passkey and relying party always produce the same key. A different passkey produces a
different key, so data encrypted with a lost passkey cannot be decrypted.

## Architecture

The WebAuthn ceremony sits behind one contract, `WebauthnAuthenticator`
(`suite-common/platform-encryption`), with `createCredential()` and `evaluatePrf()`. The encryption
(`createWebauthnPlatformEncryption` in `suite/platform-encryption-webauthn`) only depends on that
contract and on a credential-ID storage. Each composition root picks the implementation:

| Platform              | Implementation                                                               | Why                                                                                                                                       |
| --------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Web                   | `createBrowserWebauthnAuthenticator` with `navigator.credentials`            | The browser provides WebAuthn and its UI.                                                                                                 |
| Desktop macOS         | `createDesktopApiWebauthnAuthenticator` → main process → `electron-webauthn` | Electron's own Touch ID and platform-passkey authenticators ignore PRF. `electron-webauthn` calls Apple's AuthenticationServices instead. |
| Desktop Windows/Linux | `createFrameWebauthnAuthenticator` → hidden iframe                           | WebAuthn rejects `file:` pages. The iframe runs the browser authenticator at `http://localhost:21345`.                                    |

Details of the desktop iframe path:

- The renderer stays on `file://`, so its storage keeps its origin.
- The main process answers `http://localhost:21345` itself with `protocol.handle('http', …)`, so no
  port is opened. Every other `http` request is passed through `net.fetch`.
- The renderer and the iframe talk over `postMessage`. Creating a credential in a cross-origin frame
  needs a user activation in that frame, so the renderer first calls `webauthn/activate-frame`, and
  the main process runs `executeJavaScript('void 0', true)` in the frame.

Every part takes its browser or Electron APIs as dependencies and has unit tests next to it.

## Platform status

| Platform        | Authenticators with PRF                                       | Status                                                    |
| --------------- | ------------------------------------------------------------- | --------------------------------------------------------- |
| macOS desktop   | iCloud Keychain passkeys and Touch ID through the native API  | Verified with a personal team and test domain, macOS 26   |
| macOS desktop   | USB security keys with hmac-secret                            | Not routed: macOS uses the native path only               |
| Windows desktop | Windows Hello (recent Windows 11), USB security keys          | Not tested                                                |
| Linux desktop   | USB security keys without PIN                                 | Not tested. Electron has no WebAuthn UI, so PIN keys fail |
| Web, Chrome     | Google Password Manager, iCloud Keychain, Windows Hello, keys | Debug panel only, relying party is the page hostname      |
| Web, Safari 18+ | iCloud Keychain passkeys                                      | Not tested                                                |
| Web, Firefox    | Depends on version and authenticator                          | Not tested                                                |

## Remaining work

### 1. Relying party and the shared passkey

- [ ] Decide the relying party ID. `trezor.io` lets one synced passkey serve web Suite
      (`suite.trezor.io`) and the desktop app, so both derive the same key.
- [ ] Web: pass the relying party from configuration instead of `window.location.hostname`. Keep the
      hostname for local development, where `localhost` cannot use `trezor.io`.
- [ ] Desktop: `webauthnRelyingPartyId` in `suite-app/desktop-app-main/src/config.ts` is already
      `trezor.io`.
- [ ] The native macOS API reports `origin: "https://<rpId>"` in `clientDataJSON`. Nothing verifies
      assertions on a server today, so this only matters if that changes.

### 2. Apple setup for macOS production builds

All of these are needed together, or macOS refuses the passkey request with "not associated with
domain".

- [ ] Enable the Associated Domains capability on the App ID `io.trezor.TrezorSuite` in team
      `C3P22XVH2C`.
- [ ] Create a Developer ID provisioning profile for that App ID and store it as a secret of the
      release workflow (`release-suite-desktop-web-staging.yml`).
- [ ] Embed the profile in codesign builds with `mac.sign.provisioningProfile` in
      `suite-app/desktop-app/electron-builder-config.js`.
- [ ] Add to `entitlements.mac.webauthn.plist`:
    - `com.apple.application-identifier` = `C3P22XVH2C.io.trezor.TrezorSuite`
    - `com.apple.developer.team-identifier` = `C3P22XVH2C`
    - `com.apple.developer.associated-domains` = `webcredentials:trezor.io`
- [ ] The plist already lists `keychain-access-groups` for the Touch ID authenticator. Restricted
      entitlements without an embedded profile make macOS kill the app at launch. Either keep them
      together with the profile, or drop `app.configureWebAuthn({ touchID })` and the keychain group,
      since the native path does not need them.
- [ ] Serve `https://trezor.io/.well-known/apple-app-site-association` with content type
      `application/json`:

    ```json
    { "webcredentials": { "apps": ["C3P22XVH2C.io.trezor.TrezorSuite"] } }
    ```

    Apple fetches it through its CDN, which can take time to pick up changes.

- [ ] Ad hoc signed CI builds (`build-desktop-apps.yml`) cannot use passkeys. Testing needs a build
      signed with a team certificate and profile.

For local development with a personal team: add `?mode=developer` to the associated domain, add
`com.apple.security.get-task-allow`, run `sudo swcutil developer-mode -e true`, and install the app
in `/Applications`. Without `get-task-allow`, macOS ignored the app's associated domains completely.

### 3. The `electron-webauthn` dependency

- [ ] Security review. It is a young, single-maintainer package that loads native code through the
      prebuilt `objc-js` N-API binary, and its `@oslojs/*` dependencies are marked deprecated on npm.
      Options: accept it pinned, fork it under the Trezor organization, or replace it with an own
      binding in `suite/desktop-app-native-bindings`.
- [ ] Verify the packaged app on both macOS architectures: `objc-js` ships prebuilds for arm64 and
      x64, and `asar.unpack` must keep them loadable.
- [ ] macOS 15 or later is required for PRF. Decide what older macOS versions get.

### 4. Windows and Linux

- [ ] Test the iframe path on Windows with Windows Hello and with a USB security key, and record
      which Windows builds return PRF.
- [ ] Test Linux with a USB security key.
- [ ] Review the global `http` handler. Electron cannot take over a single origin, so every plain
      `http` request from the renderer goes through `net.fetch` in the main process. Check Trezor
      Bridge, CoinJoin, Tor and the development server. Failed pass-through requests already become
      network errors instead of unhandled rejections.

### 5. Missing PRF, fallback and migration

- [ ] Decide the behaviour when no authenticator returns PRF (Linux without a key, older macOS,
      Windows without PRF, browsers without PRF). Options: Electron `safeStorage` on desktop, no
      encryption feature, or a key from the Trezor (SLIP-11 `CipherKeyValue`).
- [ ] Before this branch, desktop encrypted with `safeStorage`. Data already encrypted that way, such
      as the Suite Sync owner and delegated identity keys, needs a migration: decrypt with
      `safeStorage`, encrypt again with the passkey key.
- [ ] Add a version byte to the ciphertext so the format can change later.

### 6. Losing the passkey or the credential ID

- [ ] The credential ID lives in `localStorage`. If it is cleared, the passkey still exists but Suite
      does not know which one to ask. Create passkeys as discoverable (`residentKey: 'required'`) and
      fall back to a request without `allowCredentials`, so the user can pick the passkey again.
      Web and the iframe path currently use `residentKey: 'discouraged'`.
- [ ] If the passkey itself is deleted, the data is lost. Only encrypt data that can be recreated,
      or document this for users.

### 7. User experience

- [ ] First setup asks twice: the native macOS API returned no PRF output at creation, so a second
      request reads it. Check whether evaluating PRF during creation works on newer systems.
- [ ] Replace the debug-panel flow with user-facing prompts, copy and translations, and handle
      cancellation and time-outs.
- [ ] Keep credential IDs and PRF outputs out of logs, analytics and Sentry.

### 8. Verification and review

- [ ] Run the unit tests. They are written but were not run:

    ```
    yarn workspace @suite/platform-encryption-webauthn test:unit --coverage=0
    yarn workspace @suite/platform-encryption-electron test:unit --coverage=0
    yarn workspace @suite-app/desktop-app-main test:unit --coverage=0 src/libs/native-webauthn-authenticator.test.ts src/libs/webauthn-frame.test.ts src/libs/webauthn-ipc.test.ts
    ```

- [ ] Add E2E coverage with a virtual authenticator. Playwright can add one through the Chrome
      DevTools Protocol (`WebAuthn.addVirtualAuthenticator` with `hasPrf: true`) for web and for the
      Electron iframe path. The native macOS path cannot be driven this way and needs manual testing.
- [ ] Run the package typechecks and the CI gates on the final branch.
- [ ] Update the pull request description, which still describes the first, local-server approach.
