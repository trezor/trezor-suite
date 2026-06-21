# `packages/connect` device concurrency model

> Scope: the device concurrency layer — `Device.ts` (per-device run-queue),
> `core/index.ts` (method dispatch / override), `DeviceCurrentSession.ts`
> (per-call transport loop) and `DeviceList.ts` (shared device registry).
> This document maps the **actual** concurrency seams in the code as of this
> branch and derives the **invariants** that must hold. It makes no claim about
> specific bugs — those are the subject of the fuzz harness (PHASE 2/3).

All line references are to the files in `packages/connect/src/`.

---

## 1. The seams

### 1.1 `Device` per-device run-queue (`device/Device.ts`)

A `Device` is the unit of mutual exclusion. The intended workflow per call is:

```
acquire -> (handshake/getFeatures/initialize) -> firmware/language checks
        -> fn() -> reload features -> [keepSession?] -> release
```

State fields that form the concurrency surface (`Device.ts:124-178`):

| field                                    | role                                                    |
| ---------------------------------------- | ------------------------------------------------------- |
| `runPromise?: Promise<void>`             | the single in-flight run; presence ⇒ device busy        |
| `runAbort?: AbortController`             | abort handle for the in-flight run                      |
| `acquirePromise?`                        | in-flight `transport.acquire(...)`                      |
| `releasePromise?`                        | in-flight `transport.release(...)`                      |
| `sessionAcquired: Session \| null`       | the session this instance owns (null ⇒ not held here)   |
| `keepTransportSession: boolean`          | suppresses `release()` until a `keepSession:false` call |
| `currentSession?: DeviceCurrentSession`  | per-acquire transport call wrapper                      |
| `sessionDfd?: Deferred<Session \| null>` | resolves on the next descriptor session change          |

**`run(fn, options)` — `Device.ts:419-455`**

- Re-entrancy guard: `if (this.runPromise) throw Device_CallInProgress`.
  This is the _only_ gate for "at most one run live per device".
- Creates a fresh `runAbort`; `runPromise` is
  `Promise.race([_runInner(fn, options, signal), abortRejectPromise])`.
  The abort branch rejects with `signal.reason` when `runAbort.abort(reason)`
  fires.
- `.catch`: on any failure (incl. abort) it forces
  `keepTransportSession = false`, awaits `acquirePromise`, `stopPiggybackAck()`,
  `release()`, then rethrows.
- `.finally`: clears `runAbort` and `runPromise` (this is what re-arms the
  device for the next run).
- `.then`: if the device went from unacquired → acquired, emits
  `lifecycle DEVICE.CONNECT`.

**`_runInner(fn, options, abortSignal)` — `Device.ts:490-602`**

- If a `releasePromise` is in flight, awaits it first (a previous
  cancel/override may still be releasing).
- `acquireNeeded = !isUsedHere() || currentSession?.isDisposed()`; if so calls
  `acquire()`.
- Checks `abortSignal.aborted` right after acquire and throws `signal.reason`.
- Runs handshake/`getFeatures`/`initialize` depending on protocol (`v1`/`v2`)
  and whether `fn` is present; firmware-hash + revision checks; silent language
  update.
- `if (options.keepSession) this.keepTransportSession = true`.
- `if (fn) { await fn(); if (!skipFinalReload) await getFeatures(); }`.
- Trailing release: releases unless `keepTransportSession` is set / `keepSession`
  was requested truthy.

**`acquire()` — `Device.ts:259-287`**

1. `sessionPromise = getSessionChangePromise()` (arms `sessionDfd`).
2. reads `previous` = current descriptor session from the transport.
3. `transport.acquire({ path, previous })` → `waitAndCompareSession` → on
   success sets `wasUsedElsewhere=false`, `sessionAcquired`, builds a new
   `DeviceCurrentSession`. Clears `acquirePromise` in `finally`.

**`release()` — `Device.ts:302-324`**

- Guard: `if (!sessionAcquired || keepTransportSession || releasePromise) return;`
  (note: **returns `undefined`, not a promise**, in the no-op case).
- `transport.release(...)` → `waitAndCompareSession` → on success
  `sessionAcquired = null`. Clears `releasePromise` in `finally`.

**`waitAndCompareSession` — `Device.ts:237-257`** confirms that after an
acquire/release the descriptor's session changed to the expected value, by
awaiting the `sessionDfd` promise (resolved from `updateDescriptor`). Mismatch ⇒
`SESSION_WRONG_PREVIOUS`; rejection ⇒ `DEVICE_DISCONNECTED_DURING_ACTION`.

**`interrupt(reason)` — `Device.ts:457-465`**

```
await abortThpWorkflow(this);
await this.currentSession?.abort(reason);   // aborts the in-flight typedCall
this.runAbort?.abort(reason);               // rejects the run-race
await this.currentRun;                      // currentRun = runPromise.catch(()=>{})
```

So `interrupt` waits for the targeted run to settle before returning.

### 1.2 Externally-driven session transitions (`Device.ts`)

`onTransportDeviceEvent` (`Device.ts:212-222`) dispatches transport events:

- `DEVICE_SESSION_CHANGED` → `updateDescriptor(descriptor)` (`:382-402`):
  resolves `sessionDfd` with the new session; awaits `acquirePromise` &
  `releasePromise`; if `descriptor.session` differs from `sessionAcquired` →
  `usedElsewhere()`; if `descriptor.session` is null → `keepTransportSession=false`.
- `DEVICE_REQUEST_RELEASE` → `usedElsewhere()` (`:471-488`): sets
  `wasUsedElsewhere`, and if we hold a session, calls
  `transport.releaseDevice(sessionAcquired)`, nulls `sessionAcquired`, and
  `runAbort?.abort(Device_UsedElsewhere)`.
- `DEVICE_DISCONNECTED` → `disconnect()` (`:902-919`): detaches listeners,
  rejects `sessionDfd`, `transport.releaseSync(sessionAcquired)`, emits
  `lifecycle DEVICE.DISCONNECT`, then `interrupt(Device_Disconnected)`.

### 1.3 Core method dispatch (`core/index.ts`)

- `onCall` (`:186-259`): `methodSynchronize` (a `getSynchronize()` mutex,
  `:777`) serializes method _loading_; then `resolveWaitForFirstMethod()` and
  `callMethods.push(method)`.
- `onCallDevice` (`:262-427`):
    - `selectDevice` loop until a device is found.
    - finds `previousCall` = other pending `callMethods` for the **same device
      path** (`:307-312`).
    - **override path** (`:313-330`): if `overridePreviousCall`, marks each
      pending call `overridden = true`, then `await device.interrupt(Method_Override)`.
      If _this_ method was itself overridden meanwhile, responds false and throws.
    - else if `device.currentRun` (`:331-344`): if `isUnacquired()` await
      `currentRun` (corner case: first-load self-release), otherwise respond
      `Device_CallInProgress`.
    - `device.run(innerAction, { keepSession, skipFinalReload, useCardanoDerivation })`.
- `sendCoreMessage` (`:790-801`): on a RESPONSE event, splices the method out of
  `callMethods`; when the array empties, re-arms `waitForFirstMethod`.
- `onCallCancel` / `abortController` reject in-flight work on cancel/dispose.

### 1.4 Per-call transport loop (`device/DeviceCurrentSession.ts`)

- `typedCall` (`:105-159`): creates a per-call `abortController`, runs
  `callLoop`, stores `callPromise`. The loop races each `transport.call` against
  `abortPromise`; on abort during a `ButtonAck` it sends a `Cancel`.
- `abort(reason)` (`:362-366`): aborts the call's controller, awaits
  `callPromise`, sets `disposed = reason` (so later calls short-circuit).
- A transport `deviceEvents.once` listener (`:89-98`) sets `disposed` and aborts
  on disconnect / used-elsewhere.

### 1.5 Shared device registry (`device/DeviceList.ts`)

- `devices: Device[]` (`:114`) is mutated from event handlers:
    - `onDeviceConnected` (`:176-228`, **async**): creates a `Device`, runs its
      `handshake()` under `handshakeLock` (a `getSynchronize()` mutex serializing
      handshakes, `:149`), and — only if `stillConnected` — `devices.push(device)`
      and wires lifecycle listeners. The `DEVICE.DISCONNECT` lifecycle handler
      (`:219-225`) splices the device back out.
    - `enumerate` (`:388-397`): per transport, `await transport.enumerate()` then
      `transport.handleDescriptorsChange(payload)` (which in turn fans out
      connect/disconnect/session-changed device events).
- Lookups (`getDeviceByPath`, `getOnlyDevice`, `getDeviceByStaticState`,
  `getPrioritizedDevices`) all read the live `devices` array.

---

## 2. Invariants

These are the properties the harness asserts after every step and at quiescence.

### INV-1 — Mutual exclusion (one run body per device)

At most one `_runInner` body is executing for a given `Device` at any time.
Enforced solely by the `if (this.runPromise) throw Device_CallInProgress` guard
(`Device.ts:420`). Corollary: `acquire()`/`release()`/`fn()` of two different
runs never interleave on the same device.

### INV-2 — Liveness (every run settles)

Every `run()` that does not throw synchronously eventually settles (resolve or
reject); no `runPromise`, `acquirePromise`, `releasePromise`, `sessionDfd`, or
`callPromise` remains pending once the system is quiescent (no further
transport events / no pending method). In particular `interrupt()` must return.

### INV-3 — Session balance

- `sessionAcquired` is non-null iff this instance currently owns a transport
  session; every successful `acquire()` is matched by exactly one `release()`
  (or an external `usedElsewhere`/`disconnect` that nulls it).
- A `release()` only ever releases the session this instance owns — it never
  releases another owner's session.
- `keepTransportSession` is honored: while set, the trailing `release()` in
  `_runInner` and the standalone `release()` are no-ops; it is cleared on a
  `keepSession:false` call, on run failure, on descriptor session→null, and on
  `setInstance` change.

### INV-4 — Abort / override correctness

`interrupt(reason)` rejects **exactly** the in-flight run for the target device
(via `runAbort` + `currentSession.abort`), leaves `runPromise`/`runAbort`
cleared, and leaves the device in a state from which the next `run()` succeeds
(no stuck `Device_CallInProgress`, no orphaned session). In the override path
(`core/index.ts:313-330`) the overriding method proceeds and each overridden
method responds with `Method_Override`.

### INV-5 — `DeviceList` consistency

Under interleaved connect / disconnect / enumerate / session-change events:

- no device path appears twice in `devices`;
- a device that completed handshake and is still connected is present exactly
  once; a disconnected device is removed exactly once;
- no device is "lost" (handshaked + connected but missing from `devices`) and
  none is leaked (disconnected but still in `devices`).

---

## 3. Seams flagged for the harness (non-speculative)

Concrete interleaving points worth driving — listed as _questions to verify_,
not as asserted bugs:

1. **`release()` no-op returns `undefined`.** Callers that `await this.release()`
   are fine, but any code expecting a promise in the guarded branch
   (`Device.ts:303`) gets `undefined`. Verify all call sites tolerate it under
   overlap with an in-flight `releasePromise`.
2. **`run()` re-entrancy vs `interrupt()`.** `core` calls
   `device.interrupt()` then expects to `device.run()` (override path). Verify
   no window where `runPromise` is still set when the override's `run()` is
   issued (would throw `Device_CallInProgress`).
3. **Single `sessionDfd` shared by acquire & release.** Both `acquire()` and
   `release()` arm/await the _same_ `sessionDfd` slot (`getSessionChangePromise`,
   `Device.ts:224-235`). Verify overlapping acquire/release (e.g. interrupt mid-
   acquire) cannot resolve the wrong waiter or drop a session-change.
4. **`usedElsewhere()` during an in-flight `acquire()`.** `usedElsewhere` nulls
   `sessionAcquired` and aborts the run; an `acquire()` resolving afterwards sets
   `sessionAcquired` again (`Device.ts:269`). Verify ordering cannot leave a
   session owned-but-aborted or aborted-but-owned.
5. **`DeviceList.onDeviceConnected` async gap.** Between `new Device(...)` and
   `devices.push(...)` there is an `await handshakeLock(...)`; a disconnect for
   the same path arriving in that window has no device in `devices` to splice.
   Verify no duplicate (re-connect) or lost (disconnect-then-late-push) entry.
6. **`enumerate()` concurrent with connect/disconnect.** `handleDescriptorsChange`
   fans out events that mutate `devices` while another `enumerate()` /
   connect handler is mid-flight. Verify registry consistency (INV-5).

---

## 4. Harness (PHASE 2 — implemented)

A deterministic mock transport whose `acquire`/`release`/`call`/`send`/`receive`/
`enumerate` settle **on command** (controllable deferreds) so the test drives
every interleaving. `fast-check` generates operation sequences and the harness
asserts the invariants after every step and at quiescence.

- `__tests__/support/controllableTransport.ts` — `ControllableTransport extends
AbstractTransport`. The transport methods the `Device` calls park their result
  in a FIFO of deferreds; `completeAcquire`/`completeRelease`/`completeMessage`
  settle them on command. Session transitions go through the **real**
  `handleDescriptorsChange`, so `getSessionChangePromise`/`waitAndCompareSession`
  run exactly as in production. (`init()`/`listen()` must run first — otherwise
  `handleDescriptorsChange` short-circuits on `stopped` and no
  `DEVICE_SESSION_CHANGED` ever fans out.)
- `__tests__/deviceConcurrency.fuzz.test.ts` — drives `run` / `completeAcquire`
  (+`Fail`) / `completeFn` / `completeRelease` / `completeMessage` / `interrupt`
  with a `keepSession` toggle, then drains to quiescence. Asserts INV-1
  (`live`/`activeFn` ≤ 1), INV-2 (drain reaches quiescence within a bound), INV-3
  (releases never exceed acquires), INV-4 (post-quiescence the device accepts a
  fresh `run`). The firmware/handshake/feature-reload middle of `_runInner` is
  stubbed so only the queue + session mechanics are exercised. Run via
  `yarn workspace @trezor/connect test:fuzz` (env `FUZZ_RUNS` / `FUZZ_SEED`).

**Faithfulness note.** The generated `fn` body honors the run's abort signal,
mirroring a real method whose in-flight `typedCall` is aborted by `interrupt`.
An earlier abort-agnostic `fn` produced a spurious "two fn bodies concurrent"
INV-1 report — a harness artifact, not a Device bug — which is why the body must
model prompt abort response.

### Deferred to PHASE 3

- The externally-driven `requestRelease` / `externalSession` (`usedElsewhere`)
  ops are implemented in the harness `step()` but held out of the generator. They
  open the **acquire-vs-session-change** race where `updateDescriptor` awaits a
  rejecting `acquirePromise` (`Device.ts:385`) on an event-handler path with no
  `catch` → a candidate unhandled rejection. This must be confirmed against real
  Device semantics (not the mock) before being asserted on.
- INV-5 (`DeviceList` consistency) needs a `DeviceList`/`Core`-level harness, not
  a single `Device`; it is out of scope for this file.

For each distinct, **verified** violation: shrink, commit a minimal deterministic
repro + a note (invariant, interleaving, suspected root cause), and only commit a
fix if it is obviously correct and all existing tests pass.
