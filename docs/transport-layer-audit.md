# Transport Layer Refactor Plan

Actionable checklist for stabilizing transport sessions/concurrency and related bugs.

How to use this plan:

- Check a box only when code, tests, and verification for that item are done.
- Keep PRs small: 1-2 checklist items per PR.
- Prefer correctness first, then throughput/performance.

## Workstream A: Sessions Correctness (highest priority)

- [ ] A1: Replace global lock queue semantics in sessions
    - Description: Fix `waitForUnlocked`/`clearLock` behavior so one requester cannot incorrectly release another requester.
    - Rationale: Current queue semantics can release the wrong waiter and create ownership races.
    - Files:
        1. `packages/transport/src/sessions/background.ts`
    - Specific implementation instructions:
        1. Replace array-index based ownership (`locksQueue[0]`) with per-request lock token/handle.
        2. Ensure `clearLock` accepts and validates owner token.
        3. Remove `Promise.all(beforeMe)` in `waitForUnlocked`; wait only on immediate predecessor token.
        4. Guarantee every `acquireIntent`/`releaseIntent` either commits or exits with its own lock released.
        5. Enforce policy: timeout must never transfer ownership; timeout may only fail/cleanup its own request.
    - Done when:
        1. Two simultaneous acquire calls on same path result in exactly one success and one `SESSION_WRONG_PREVIOUS`.
        2. No code path can resolve a lock it does not own.

- [ ] A2: Make lock release exception-safe in release path
    - Description: Ensure release path cannot leave queue uncleared after descriptor races/disconnect.
    - Rationale: `releaseDone` can throw before unlocking, causing lock starvation until timeout.
    - Files:
        1. `packages/transport/src/sessions/background.ts`
    - Specific implementation instructions:
        1. Add descriptor existence validation before mutation in `releaseDone`.
        2. Move unlock logic into `finally` so it runs for both success and error.
        3. Return structured error when path is gone instead of throwing.
    - Done when:
        1. Releasing a disconnected device returns structured error and does not block next waiter.

- [ ] A3: Make bridge core acquire/release lock-safe on failure
    - Description: Release the session lock in `core.acquire` and `core.release` when `openDevice` or `closeDevice` fails after intent.
    - Rationale: After A1 removed auto-timeout from lock deferreds, a failed `openDevice` leaves the lock held permanently — cascading all subsequent waiters into 4s timeouts. The old code masked this with `setTimeout` auto-resolve; the new code makes the leak permanent.
    - Files:
        1. `packages/transport-bridge/src/core.ts`
    - Specific implementation instructions:
        1. In `acquire`: if `openDevice` fails after `acquireIntent` succeeded, call `sessionsClient.acquireDone` (to release the lock) and then return the error. Alternatively, add a dedicated `sessionsClient.acquireAbort` or call `releaseDone` on the intent path.
        2. In `release`: if `closeDevice` fails, still call `sessionsClient.releaseDone` so the lock is released.
        3. Use try/finally in both functions to guarantee lock release.
    - Done when:
        1. `openDevice` failure does not block subsequent acquire attempts.
        2. `closeDevice` failure does not block subsequent release/acquire attempts.

- [ ] A4: Await commit in abstractApi `acquire`
    - Description: Remove fire-and-forget `acquireDone` call.
    - Rationale: Current code can return acquire success before session commit is persisted.
    - Files:
        1. `packages/transport/src/transports/abstractApi.ts`
    - Specific implementation instructions:
        1. Change `this.sessionsClient.acquireDone(...)` to awaited call.
        2. If acquireDone fails, close opened device and return structured error.
        3. Add logging for rollback branch.
    - Done when:
        1. `acquire` returns success only after session state commit succeeds.

- [ ] A5: Introduce per-device session queues
    - Description: Remove cross-device blocking in sessions background.
    - Rationale: Global queue serializes unrelated devices, causing head-of-line blocking.
    - Files:
        1. `packages/transport/src/sessions/background.ts`
    - Specific implementation instructions:
        1. Replace single `locksQueue` with `Map<PathInternal, DeviceQueueState>`.
        2. Route `acquireIntent` and `releaseIntent` to queue keyed by resolved `pathInternal`.
        3. Cleanup queue entry when device disconnects or queue becomes empty.
    - Done when:
        1. Parallel acquire/release on different paths do not wait for each other.

- [ ] A6: Add fencing generation to session state
    - Description: Add per-device monotonic generation token and validate it on state transitions.
    - Rationale: Prevent stale completions from overwriting newer ownership.
    - Files:
        1. `packages/transport/src/sessions/background.ts`
        2. `packages/transport/src/sessions/types.ts`
        3. Call sites in transports that use session lookups
    - Specific implementation instructions:
        1. Extend descriptor/session state with `generation: number`.
        2. Increment generation on successful acquire commit.
        3. Include generation in acquire result and require it for release/call/send/receive validation where feasible.
        4. Reject operations where generation does not match current owner.
    - Done when:
        1. Stale acquire/release completions are rejected deterministically in tests.

---

## Workstream B: Sessions Runtime Reliability

- [ ] B0: Fix multiple-sessions e2e test
    - Description: Restore the commented-out `stealBridgeSession()` call in the test, or rewrite the last two steps to match the intended behavior.
    - Rationale: Commit `41a10e26ab` commented out the second `stealBridgeSession()` call that set up the `TR_USE_HERE` condition for the final assertion. The last step now expects `TR_USE_HERE` (session stolen) but nothing steals the session after the previous step restored `TR_CONNECTED`. The test always times out at 30s.
    - Files:
        1. `suite/e2e/tests/suite/multiple-sessions.test.ts`
    - Specific implementation instructions:
        1. Uncomment the "Reload inactive suite session" step which calls `stealBridgeSession()`, reloads, and expects Suite auto-reacquires after reload.
        2. Remove the broken "After reloading inactive suite session does not take Bridge session back" and trailing "Take Bridge session back" steps.
    - Done when:
        1. `yarn e2e:suite multiple-sessions` passes reliably.

- [ ] B1: Fix SharedWorker port lifecycle leak
    - Description: Remove dead ports from shared worker broadcast list.
    - Rationale: Dead ports accumulate and degrade broadcast loop health.
    - Files:
        1. `packages/transport/src/sessions/background-sharedworker.ts`
    - Specific implementation instructions:
        1. Track ports in `Set<MessagePort>` instead of array.
        2. Register per-port cleanup on close/error (or failed postMessage handling).
        3. During broadcast, catch failures and prune dead ports.
    - Done when:
        1. Repeated connect/disconnect cycles keep port count stable.

- [ ] B2: Fix browser background request hang on message error
    - Description: Ensure `handleMessage()` promise always resolves or rejects.
    - Rationale: Current `onmessageerror` removes listener without settling promise.
    - Files:
        1. `packages/transport/src/sessions/background-browser.ts`
    - Specific implementation instructions:
        1. In `onmessageerror`, reject promise with structured error.
        2. Ensure listener cleanup runs exactly once (success/error/timeout).
        3. Add optional request timeout guard as fallback.
    - Done when:
        1. Forced message error does not leave pending promises.

- [ ] B3: Add explicit session-invariant tests
    - Description: Add tests for ownership and queue safety.
    - Rationale: Current tests cover some happy paths but not all race invariants.
    - Files:
        1. `packages/transport-test/e2e/bridge/bridge.test.ts`
        2. Add/extend unit tests around sessions background if available
    - Specific implementation instructions:
        1. Add test: same-path concurrent acquire => one success, one wrong previous.
        2. Add test: different-path concurrent acquire => both proceed without blocking.
        3. Add test: release path with missing descriptor => lock cleanup still occurs.
        4. Add test: timeout never grants ownership to another waiter; timed-out request fails explicitly.
    - Done when:
        1. All invariants are covered and reproducible.

---

## Workstream C: Transport Isolation and Throughput

- [ ] C1: Path-scoped isolation in AbstractApi
    - Description: Avoid global serialization in `runInIsolation`.
    - Rationale: `getSynchronize()` is currently used without lock id, serializing unrelated operations.
    - Files:
        1. `packages/transport/src/api/abstract.ts`
    - Specific implementation instructions:
        1. Change `this.synchronize(fn)` to `this.synchronize(fn, path)` in `runInIsolation`.
        2. Keep read/write conflict check (`requestAccess`) intact per path.
        3. Validate no regressions in `OTHER_CALL_IN_PROGRESS` behavior for same path.
    - Done when:
        1. Calls on different paths can run concurrently while same-path conflicts remain guarded.

- [ ] C2: Keep listener ordering safe in AbstractApiTransport
    - Description: Attach API listeners before starting listen stream.
    - Rationale: Prevent first emitted descriptor update from being lost.
    - Files:
        1. `packages/transport/src/transports/abstractApi.ts`
    - Specific implementation instructions:
        1. Move `this.api.on('transport-interface-change', ...)` registration before `this.api.listen()`.
        2. Preserve existing `this.listening` guard.
    - Done when:
        1. No missed first-event race under simulated connect-at-start.

---

## Workstream D: Confirmed Data-Plane Bugs

- [ ] D1: USB reset race fix
    - Description: Make `resetDevice` deduplicated and awaitable.
    - Rationale: Boolean flag check/set is non-atomic and can start multiple resets.
    - Files:
        1. `packages/transport/src/api/usb.ts`
    - Specific implementation instructions:
        1. Replace `deviceResetMap[path]: boolean` with `Map<path, Promise<void>>`.
        2. If reset in progress, return/await existing promise.
        3. Clear map entry in `finally`.
    - Done when:
        1. Concurrent reset callers await same reset task.

- [ ] D2: USB selectConfiguration failure handling
    - Description: Stop open flow after configuration failure.
    - Rationale: Continuing to claim interface after config failure creates misleading downstream errors.
    - Files:
        1. `packages/transport/src/api/usb.ts`
    - Specific implementation instructions:
        1. Return structured open error immediately on selectConfiguration catch.
        2. Do not proceed to claimInterface in this branch.
    - Done when:
        1. Config failure surfaces as immediate open failure.

- [ ] D3: USB releaseInterface failure recovery
    - Description: Add deterministic fallback or hard-fail path.
    - Rationale: Swallowing release failure can leave interface stuck claimed.
    - Files:
        1. `packages/transport/src/api/usb.ts`
    - Specific implementation instructions:
        1. On releaseInterface failure, attempt `device.reset()` fallback where safe.
        2. If fallback fails, return structured close error.
    - Done when:
        1. Subsequent open attempts do not silently fail due to stale claim.

- [ ] D4: BLE write error propagation
    - Description: Do not swallow write failures.
    - Rationale: Silent failure can corrupt protocol flow (especially firmware update).
    - Files:
        1. `packages/transport-native-bluetooth/src/api/bluetoothManager.ts`
    - Specific implementation instructions:
        1. Re-throw write error after logging, or return typed error result.
        2. Ensure caller converts it to structured transport error.
    - Done when:
        1. Failed BLE write propagates to API caller as failure.

- [ ] D5: BLE connect deduplication and monitor cleanup
    - Description: Guard concurrent connect attempts and cleanup monitor subscriptions on disconnect.
    - Rationale: Current behavior can overwrite connected device state and keep ghost callbacks alive.
    - Files:
        1. `packages/transport-native-bluetooth/src/api/bluetoothManager.ts`
    - Specific implementation instructions:
        1. Add `inFlightConnects: Map<DeviceId, Promise<Device>>` and reuse pending connect.
        2. Store monitor unsubscribe handles per device.
        3. On disconnect, cancel reads and unsubscribe all monitors before deleting state.
    - Done when:
        1. Concurrent connect on same device converges to one successful connection path.
        2. No messages are accepted after disconnect cleanup.

---

## Workstream E: Hygiene and Leak Prevention

- [ ] E1: Ensure merged abort listeners are always cleaned up
    - Description: Verify every merged signal path clears listeners.
    - Rationale: Missing cleanup accumulates abort listeners and closures.
    - Files:
        1. `packages/transport/src/transports/abstract.ts`
        2. Call sites using `scheduleAction`
    - Specific implementation instructions:
        1. Keep cleanup in `.finally(clear)` (already present).
        2. Audit any direct `mergeAbort` usage outside `scheduleAction` and enforce `finally` cleanup.
    - Done when:
        1. No call path leaves merged listeners attached after completion.

- [ ] E2: HTTP handler defensive catch/finally cleanup
    - Description: Add defensive `.catch` and always-run cleanup for abortable session entries.
    - Rationale: Low-risk correctness issue, but improves resilience and avoids leaked abort entries.
    - Files:
        1. `packages/transport-bridge/src/http.ts`
    - Specific implementation instructions:
        1. Add `.catch(...)` for each async route chain.
        2. Move `removeAbortableSignal(session)` into `.finally(...)` for `call/read` handlers.
        3. Keep current structured error response format.
    - Done when:
        1. Handler-level throws do not leak abortable signals.

- [ ] E3: Immediate `/listen` subscription cleanup
    - Description: Remove dead subscriptions on response close, not only on descriptor changes.
    - Rationale: Prevent unbounded list growth under unstable network conditions.
    - Files:
        1. `packages/transport-bridge/src/http.ts`
    - Specific implementation instructions:
        1. Register `res.on('close', ...)` to remove entry immediately.
        2. Keep existing descriptor-diff dispatch behavior.
    - Done when:
        1. Disconnecting clients do not accumulate stale subscription entries.

---

## Workstream F: Optional Protocol Hardening

- [ ] F1: THP deadline enforcement at I/O level
    - Description: Ensure deadline cannot be exceeded by a long in-flight attempt.
    - Rationale: Pre-attempt deadline check is insufficient for long single operations.
    - Files:
        1. `packages/transport/src/thp/loop.ts`
    - Specific implementation instructions:
        1. Thread merged timeout/abort signal into each read/write attempt.
        2. Abort in-flight attempt when deadline expires.
    - Done when:
        1. No attempt can run past configured deadline without failure.

- [ ] F2: THP nonce/state race audit
    - Description: Ensure no await-gap race around nonce checks and sync updates.
    - Rationale: Prevent stale/non-atomic state updates.
    - Files:
        1. `packages/transport/src/thp/send.ts`
        2. `packages/transport/src/thp/call.ts`
    - Specific implementation instructions:
        1. Audit check-update sections for await boundaries.
        2. Refactor to atomic compare-and-update helper where needed.
    - Done when:
        1. Concurrent THP operations preserve valid nonce progression.

- [ ] F3: Rust WebSocket concurrency cap
    - Description: Bound spawned tasks per websocket connection.
    - Rationale: Unbounded `tokio::spawn` per frame can lead to memory pressure/OOM.
    - Files:
        1. `packages/transport-bluetooth/src/server/connection_handler.rs`
    - Specific implementation instructions:
        1. Add semaphore or buffered stream processing with fixed concurrency.
        2. Keep response ordering constraints explicit (document if unordered responses are acceptable).
    - Done when:
        1. Burst traffic does not create unbounded in-flight task growth.

---

## Workstream G: Legacy Bridge (trezord-go) Cleanup

The old trezord-go bridge (a standalone Go binary running as a system service) is deprecated and replaced by the NodeJS transport-bridge. Remnants span transport compatibility code, dual-port infrastructure, desktop app switches, deprecation UI, and CI configs. Items are ordered bottom-up: infrastructure first, then transport, then UI.

- [ ] G1: Remove old bridge binary LFS entries
    - Description: Delete dead `.gitattributes` rules that track trezord binaries in LFS.
    - Rationale: The directory `packages/suite-data/files/bin/bridge/` no longer exists. These are dead entries.
    - Files:
        1. `.gitattributes`
    - Specific implementation instructions:
        1. Remove the 3 LFS tracking lines for `packages/suite-data/files/bin/bridge/linux-*/trezord`, `mac-*/trezord`, `win-*/trezord.exe`.
    - Done when:
        1. No LFS rules reference bridge binaries.

- [ ] G2: Remove `bridge-legacy` desktop switch
    - Description: Remove the CLI flag that allows opting in to the old trezord-go bridge in suite-desktop.
    - Rationale: There is no old bridge to opt in to anymore.
    - Files:
        1. `packages/suite-desktop-core/src/libs/process-switches.ts`
        2. `docs/packages/suite-desktop/runtime-flags.md`
        3. Any runtime code that reads the `bridge-legacy` switch value
    - Specific implementation instructions:
        1. Remove `'bridge-legacy'` from the switch type/definition.
        2. Remove the `--bridge-legacy` row from runtime-flags docs.
        3. Search for and remove any conditional code that branches on this switch.
    - Done when:
        1. `--bridge-legacy` flag has no effect and is not documented.

- [ ] G4: Remove dual BridgeTransport instantiation
    - Description: Stop creating two BridgeTransport instances (ports 21328 + 21325) in connect.
    - Rationale: With the old bridge gone, only one transport instance targeting the primary port is needed. The compatibility port (21325) continues to exist in transport-bridge for now but does not require a second client.
    - Files:
        1. `packages/connect/src/device/TransportList.ts`
        2. `packages/transport/src/transports/bridge.ts`
    - Specific implementation instructions:
        1. Remove the second `BridgeTransport` instance for port 21325.
        2. Change `DEFAULT_PORT` in `bridge.ts` from 21325 to 21328.
    - Done when:
        1. Only one BridgeTransport instance is created, targeting port 21328.

- [ ] G5: Remove legacy bridge protocol compatibility code
    - Description: Remove `isOutdated`, `useProtocolMessages` toggle, and legacy hex-string protocol path.
    - Rationale: The NodeJS bridge always supports protocol messages. The legacy code path is unreachable once old bridge support is removed.
    - Files:
        1. `packages/transport/src/transports/bridge.ts` (remove `isOutdated` flag, `useProtocolMessages` toggle, `getProtocol()` legacy fallback)
        2. `packages/transport/src/utils/bridgeProtocolMessage.ts` (remove legacy hex-string parsing/creation)
    - Specific implementation instructions:
        1. Remove `if (!this.version.startsWith('3'))` outdated check and the `isOutdated` property.
        2. Remove `useProtocolMessages` property; always assume protocol messages are supported.
        3. In `getProtocol()`, remove the `if (!this.useProtocolMessages) return protocolBridge` fallback.
        4. In `bridgeProtocolMessage.ts`, remove the "Legacy bridge results" parsing branch in `validateProtocolMessage()` and the raw-hex path in `createProtocolMessage()`.
    - Done when:
        1. No code path falls back to legacy protocol encoding.

- [ ] G6: Remove legacy bridge guards in connect
    - Description: Remove `isLegacyBridge()` and version-gated workarounds in connect.
    - Rationale: These guards add delay and block features (THP) for an old bridge that no longer exists.
    - Files:
        1. `packages/connect/src/device/workflow/handshake.ts` (remove `isLegacyBridge()` and 501ms delay)
        2. `packages/connect/src/device/Device.ts` (remove THP incompatibility guard for bridge < 3.0.0)
    - Specific implementation instructions:
        1. Remove the `isLegacyBridge()` function and its call site.
        2. Remove the `resolveAfter(501)` delay that only applies to legacy bridge.
        3. Remove the `!versionUtils.isNewerOrEqual(this.transport.version, '3.0.0')` THP guard.
    - Done when:
        1. No version-gated legacy bridge workarounds in connect.

- [ ] G7: Remove bridge deprecation UI
    - Description: Remove the deprecation modal, banner, route, translations, and URL constant.
    - Rationale: Once the old bridge is no longer supported, there is nothing to deprecate or uninstall.
    - Files:
        1. `packages/suite/src/views/suite/bridge-deprecated/index.tsx`
        2. `packages/suite/src/components/suite/banners/SuiteBanners/BridgeDeprecatedBanner.tsx`
        3. `suite/router-config/src/routeConfig.ts` (remove `suite-bridge-deprecated` route)
        4. `suite/intl/src/messages.ts` and locale JSON files (remove `TR_STANDALONE_BRIDGE_DEPRECATED*` keys)
        5. `packages/urls/src/urls.ts` (remove `UNINSTALL_BRIDGE_URL`)
    - Specific implementation instructions:
        1. Delete the bridge-deprecated view component.
        2. Delete the `BridgeDeprecatedBanner` component and remove references from banner list.
        3. Remove the `suite-bridge-deprecated` route entry.
        4. Remove translation keys for standalone bridge deprecation from all locales.
        5. Remove `UNINSTALL_BRIDGE_URL` constant.
    - Done when:
        1. No UI references the old standalone bridge.

- [ ] G8: Update tests and CI to target port 21328 only
    - Description: Remove references to port 21325 from tests, docker configs, and CI scripts.
    - Rationale: Once the dual BridgeTransport is removed, tests should target only the primary port.
    - Files:
        1. `docker/docker-compose.transport-test-ci.yml`
        2. `docker/docker-connect-test.sh`
        3. `packages/transport-test/e2e/bridge/headers.test.ts`
        4. Any other test files referencing port 21325
    - Specific implementation instructions:
        1. Replace port 21325 with 21328 in all test targets.
        2. Remove any dual-port test assertions.
    - Done when:
        1. All tests target port 21328

- [ ] G9: Clean up stale comments and references
    - Description: Remove or update comments referencing trezord-go source code, old bridge behavior, and stale architectural notes.
    - Rationale: Stale comments mislead future developers.
    - Files:
        1. `packages/transport/src/transports/bridge.ts` (GitHub URLs to trezord-go)
        2. `packages/transport/src/errors.ts` (trezord-go source links)
        3. `packages/suite/src/components/suite/PrerequisitesGuide/DeviceUnreadable.tsx` (stale comment about legacy bridge opt-in)
        4. `packages/suite/src/views/settings/SettingsDebug/Transport.tsx` (description mentioning trezord-go)
    - Specific implementation instructions:
        1. Remove or replace GitHub links to `trezor/trezord-go`.
        2. Update description strings to reference only the NodeJS bridge.
        3. Remove stale comments about legacy bridge opt-in.
    - Done when:
        1. No code comments reference trezord-go as a current/supported option.

- [ ] G10: Replace bridge REST API with WebSocket transport (future)
    - Description: Replace the HTTP request/response bridge API with a persistent WebSocket connection on both ports.
    - Rationale: The REST API requires long-polling for `/listen`, creates a new TCP connection per request, and maintains a separate protocol encoding layer. A WebSocket transport eliminates all of these issues. Port 21325 stays but serves WebSocket instead of REST.
    - Files:
        1. `packages/transport-bridge/src/http.ts` (replace REST handlers with WebSocket server)
        2. `packages/transport/src/transports/bridge.ts` (replace HTTP client with WebSocket client)
        3. Related test and CI infrastructure
    - Specific implementation instructions:
        1. Design WebSocket message protocol (multiplex acquire/release/call/listen over a single connection).
        2. Implement server-side in transport-bridge, serving on both 21328 and 21325.
        3. Implement client-side transport replacing BridgeTransport.
        4. Drop REST API and all HTTP-specific code.
    - Done when:
        1. Bridge communication uses WebSocket exclusively on both ports.
        2. Legacy REST API is gone.

---

## Suggested PR Sequence

- [ ] PR1: A1 + A2 + A3 + B0 + tests from B3 (sessions correctness baseline + e2e fix)
- [ ] PR2: A4 + A5 + C1 + cross-device concurrency tests (B3)
- [ ] PR3: B1 + B2 + E2 + E3 (runtime hygiene)
- [ ] PR4: D1 + D2 + D3 (USB stability)
- [ ] PR5: D4 + D5 (BLE stability)
- [ ] PR6: F1 + F2 + F3 (optional hardening)
- [ ] PR7: G1 + G2 + G9 (trivial legacy cleanup — LFS, switch, comments)
- [ ] PR8: G4 + G5 + G8 (single BridgeTransport + remove legacy protocol)
- [ ] PR9: G6 + G7 (remove connect guards + deprecation UI)
- [ ] PR10 (future): G10 (WebSocket transport — replaces REST API on both ports)

---

## Verification Matrix

For each completed item, run and record:

- [ ] Unit tests for touched package(s)
- [ ] `yarn test packages/transport-test`
- [ ] Manual check: concurrent acquire same device
- [ ] Manual check: concurrent operations on two different devices (if available)
- [ ] Regression check: release/disconnect cleanup paths
