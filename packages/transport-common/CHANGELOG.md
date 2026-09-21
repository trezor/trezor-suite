# 10.0.0

- npm-prerelease: @trezor/transport-common 10.0.0-beta.3 (194eaeeb6c)
- chore(deps): bump QA and test tooling dependencies (4d66198e1f)
- npm-prerelease: @trezor/transport-common 10.0.0-beta.2 (df44effa0d)
- refactor: remove dead transport and coinjoin type properties (05ce815873)
- fix(transport): webusb crash on reload (c2c0615cd9)
- fix(suite): reduce fixture declaration size (f064808704)
- chore: apply prettier changes (7de6f3e919)
- chore(build): centralize library test exclusions (51989aff9c)
- chore: unify transport-web and transport-common version to 10.0.0-beta.1 (4fb77b067c)
- test(transport-common): co-locate tests (908c077289)
- fix(protocol): retransmission on ThpTransportBusy (67213a3505)
- refactor(transport): move BridgeTransport to @trezor/transport-common (eb319ab878)
- refactor(transport): shrink receive declaration (949bf98aee)
- refactor(transport): shrink transport declarations (9113bb1f03)
- chore(connect): publish files as js and ts, not mjs and mts (25f0ed758f)
- refactor(transport): AbstractApi `read` and `write` with options (224e3ccbfc)
- refactor: remove unnecessary type assertions (packages/* small bundle) (026e959ed9)
- refactor: remove redundant `as any` casts (9a5f1fef5a)
- chore: bump typescript to 6.0.3 (5d20986f2a)
- fix(transport): release the session lock on acquire/release api failure (ae85d1891a)
- test(transport): document bridge-core lock leak on openDevice failure (4bbefa1072)
- fix(transport-common): close two sessions lock races (c5758252a1)
- test(transport-common): fuzz sessions lock for concurrency/stealing races (32267a55e0)
- refactor(utils): move Logger interface to @trezor/utils (83f099002b)
- chore(scripts): rename libESM to lib (f046a3fd2b)
- chore(scripts): remove cjs support in replace-imports.sh (a1059cd8a3)
- fix: resolve noUncheckedIndexedAccess errors across the codebase (e0d8a3bd20)
- feat(connect): remove disableWebUSB; live transport reconfig via updateConnectSettings (4572ca8162)
- feat(transport): drop legacy bridge port 21325 support (1774c788cb)
- test(transport): document SessionsClient.dispose() listener leak on shared background (202ccc9cb0)
- test(transport): document listen()/stop() listener leak in AbstractApiTransport (33527e9956)
- refactor: apply prefer-optional-chain across monorepo (6c42d261ec)
- refactor(transport): split into transport-common / transport / transport-web (f498dcebb7)

# 1.0.0-alpha.1

Part of the Connect 10 ecosystem release.

`@trezor/transport-common` hosts the environment-agnostic transport layer: the abstract transport base classes, THP, sessions, the structural USB interface, shared utils, and `BridgeTransport`. `BridgeTransport` moved here from `@trezor/transport` so that browser and React Native consumers can use it without pulling in Node-only modules (`usb` / `dgram`).

Breaking changes:

- `BridgeTransport` `DEFAULT_PORT` changed from `21325` to `21328`. The legacy standalone `trezord-go` Bridge (port 21325) is no longer supported. Consumers running on a setup with the old standalone Bridge must migrate to the node-bridge bundled with Suite Desktop.
- Removed `isOutdated` flag on `AbstractTransport` / `BridgeTransport`. Detection of the legacy Bridge is now done outside of the transport layer.
- Removed internal `useProtocolMessages` fallback; `BridgeTransport` always uses the modern message protocols (`bridge` / `v1` / `v2`).
