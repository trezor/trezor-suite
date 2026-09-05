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
   _Verified safe — see §6 (override dispatch seam)._
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

### INV-5 harness (`DeviceList` registry consistency)

`__tests__/deviceListConsistency.fuzz.test.ts` drives the shared
`DeviceList.devices` registry directly. It wires a `ControllableTransport`'s
`DEVICE_CONNECTED` event to `DeviceList.onDeviceConnected` exactly as
`initializeTransport` does (fire-and-forget), and lets `Device.handshake()` run
**for real** against the transport (acquire → `getFeatures` (stubbed) → release),
so a disconnect arriving mid-handshake interrupts the run and makes `handshake()`
return `false` — the production signal that gates `devices.push`. `fast-check`
generates connect/disconnect/acquire/release sequences over a small path set;
after every step it asserts **no duplicate path** and at full quiescence
**present iff connected** (no _lost_ device — connected but absent — and no
_leaked_ device — present but disconnected). It surfaced Finding 3 below.

The harness's faithfulness rests on the transport modelling a physically-gone
device correctly: `disconnectPath` fails any in-flight op for that path, and
`completeAcquire` fails (rather than succeeds-and-resurrects) a path with no live
descriptor — otherwise a stale acquire settled as success would fake the device
back into existence and produce spurious findings. The disconnect error code must
be the verbatim value (`'device disconnected during action'`), not the
SCREAMING_CASE key, because `Device.handshake` matches on the value.

For each distinct, **verified** violation: shrink, commit a minimal deterministic
repro + a note (invariant, interleaving, suspected root cause), and only commit a
fix if it is obviously correct and all existing tests pass.

---

## 5. PHASE 3 findings

### Finding 1 — INV-2: leaked unhandled rejection from `updateDescriptor` (FIXED)

**Invariant:** INV-2 (liveness — no rejection escapes the device layer
unhandled).

**Interleaving (shrunk):** `run` → `externalSession` → (drain). A `run()` reaches
`transport.acquire()`; before that acquire settles, an external client takes the
device, so a `DEVICE_SESSION_CHANGED` for a **different** session arrives. The
acquire's `waitAndCompareSession` then rejects with `SESSION_WRONG_PREVIOUS`
(`Device.ts:242-246, 279`).

**Root cause:** `updateDescriptor` (the `onTransportDeviceEvent` handler, invoked
**fire-and-forget** — its returned promise is discarded by `EventEmitter.emit`)
did `await Promise.all([this.acquirePromise, this.releasePromise])`. It only needs
those to **settle** before reading `sessionAcquired`, but `Promise.all` re-raises
the acquire rejection — and there is no `catch` on the event path, so it leaks as
an unhandled rejection (one per session-changed event that observed the still-
pending acquire; the shrunk case produces two). The **run** path already handles
the same rejection (`run().catch` + `await this.acquirePromise`), so the event
path must not re-raise it.

**Fix (applied — obviously correct):** `Promise.allSettled` in `updateDescriptor`
(`Device.ts:390`). Behavior is otherwise unchanged: the post-await session
reconciliation (`usedElsewhere` / `keepTransportSession` reset / `DEVICE.CHANGED`)
now also runs in the taken-elsewhere case, which is the intended handling.

**Tests:** `deviceSessionRace.repro.test.ts` (minimal deterministic repro — fails
pre-fix with 2 rejections, passes post-fix). The fuzz harness now generates
`externalSession` and asserts no `updateDescriptor` promise rejects
(`checkDescriptorRejections`); it reds without the fix (counterexample
`run, externalSession, completeFn`) and is green with it across 2000 runs.

### Finding 2 — INV-3: leaked session from a run aborted before it acquires (FIXED)

**Invariant:** INV-3 (session balance — `acquire`/`release` paired; a session is
held only deliberately via `keepTransportSession`).

**Interleaving (shrunk):** `run, completeFn, completeAcquire, requestRelease, run,
interrupt` (fast-check seed 99; the two-`interrupt` variant `run, completeFn,
completeAcquire, interrupt, run, interrupt, completeFn` reproduces it equally).
Step by step:

1. Run A acquires `s0`, runs its `fn`, then issues its final `release()` (release
   in-flight) and is awaiting it inside `_runInner`.
2. Run A is aborted (`DEVICE_REQUEST_RELEASE → usedElsewhere`, or an `interrupt`).
   The `Promise.race` abort branch settles run A's `runPromise`; its `catch`
   handler runs `release()` — a **no-op** because a release is already pending —
   and clears `runPromise`. Run A's `_runInner` is **still suspended** at
   `await this.releasePromise`.
3. Run B starts (allowed: `runPromise` is clear) and parks at the **same**
   `await this.releasePromise`.
4. Run B is aborted before it ever reaches `acquire()`. At abort time its
   `acquirePromise` is `undefined`, so run B's `catch` handler awaits nothing and
   releases nothing.
5. The pending release settles. Run B's orphaned `_runInner` resumes past the
   park, sees `acquireNeeded` and calls `acquire()` — for an already-finished run.
   The acquire succeeds and sets `sessionAcquired = s1`, but nothing releases it.

**Root cause:** `_runInner` only checked `abortSignal.aborted` **after**
`acquire()` (`Device.ts:513`). A run aborted while parked **before** the acquire
decision keeps running in the background — it merely lost the `Promise.race`, it
was not cancelled — and proceeds to `acquire()` a session the already-settled run
can never release. The leaked session keeps the device's transport interface
occupied with `keepTransportSession === false`, contradicting INV-3.

**Fix (applied — obviously correct):** check `abortSignal.aborted` **before**
`acquire()` in `_runInner` (`Device.ts:508`). This only adds an early throw on an
already-aborted signal — identical in spirit to the existing post-acquire check,
just moved ahead of the acquire — so a non-aborted run is unaffected and an
aborted run no longer acquires a session it would leak. (The post-acquire window
remains safe: if abort fires _during_ `await this.acquire()`, `acquirePromise` is
set, so run's `catch` awaits it and releases.)

**Tests:** `deviceRunInterruptLeak.repro.test.ts` (minimal deterministic repro —
fails pre-fix with `sessionAcquired === 's1'`, passes post-fix) is the primary
regression guard for this finding. The fuzz harness gained
`checkSessionBalanceAtQuiescence` (INV-3: no session held after drain unless
`keepTransportSession`); the assertion has teeth, but this abort-before-acquire
interleaving is rare and the harness does not reliably rediscover it at the
committed default `FUZZ_SEED`/`FUZZ_RUNS` — raise `FUZZ_RUNS` or rotate seeds to
hunt it. Treat the deterministic repro, not the fuzz, as the guard for INV-3.

### Finding 3 — INV-2/INV-5: `handshakeLock` deadlock from a disconnected device's queued handshake (FIXED)

**Invariant:** INV-2 (liveness — no promise hangs after flush) and INV-5
(`DeviceList` consistency — a connected device is registered exactly once).

**Interleaving (shrunk):** `connect '1'` → `connect '2'` → `disconnect '2'` →
`connect '2'` → (drain). Device `'1'` starts handshaking and holds
`DeviceList`'s global `handshakeLock` (`DeviceList.ts:190`); device `'2'`'s
handshake is **queued** behind it. `'2'` then disconnects (while still queued) and
reconnects on the same path.

**Root cause:** `Device.disconnect()` removes the instance's
`onTransportDeviceEvent` listener (`Device.ts:917`) but the queued handshake
closure (`resolveAfter(...).then(() => device.handshake())`, already inside
`handshakeLock`) survives — `interrupt()` is a no-op because the run never
started (`runAbort` is `undefined`). When the lock reaches it, the **stale**
`'2'` instance runs `handshake()` → `run()` → `acquire()`; the reconnected path is
live, so the acquire succeeds, but `waitAndCompareSession` then awaits a
`sessionDfd` that only the now-removed listener (`updateDescriptor`) would resolve
(`Device.ts:242`, `224-235`). It hangs **forever**, holding `handshakeLock`, so
every later device's handshake — including the reconnected `'2'` — is starved.
The auth-penalty delay before each handshake
(`resolveAfter(penalty && penalty + 501)`, seconds when penalized) widens the
queued window substantially.

**Fix (applied — obviously correct):** mark a `Device` terminal on
`disconnect()` (`this.disconnected = true`, `Device.ts`) and bail before doing any
transport work: `run()` throws `Device_Disconnected` and `handshake()` returns
`false` when `disconnected`. A disconnected instance is already terminal (listeners
torn down, replaced by a fresh `Device` on reconnect), and `core` only dispatches
to registry devices, so nothing legitimately runs a disconnected device — the
guard only short-circuits the stale queued handshake, releasing the lock so the
reconnected device handshakes and registers normally.

**Tests:** `deviceListHandshakeLockDeadlock.repro.test.ts` (minimal deterministic
repro — pre-fix the reconnected `'2'` is never registered; passes post-fix). The
`deviceListConsistency.fuzz.test.ts` harness asserts no-duplicate + present-iff-
connected; it reds without the fix (counterexample
`connect 1, connect 3, disconnect 3, connect 3, connect 1`) and is green with it
across 1600 runs × seeds 1/7/42/99.

---

## 6. Override dispatch seam (verified safe — INV-4)

The last objective-enumerated seam, the `core/index.ts` override path
(`onCallDevice:313-330`), was driven directly. In production a method with
`overridePreviousCall` preempts another in-flight call to the **same device**;
`overridePreviousCall` is set by exactly **one** method — `setBusy` (`api/setBusy.ts:16`)
— so the only production-reachable override is a single `setBusy` overriding a
single in-flight call. Core's sequence is:

```
await device.interrupt(Method_Override);   // abort the in-flight run
if (method.overridden) { respond(false, Method_Override); throw; }
await device.run(innerAction, ...);        // start the overriding run
```

**The device-level contract this rests on:** the instant `await device.interrupt(reason)`
resolves, the device is immediately runnable (`device.run()` on the next line must
not throw `Device_CallInProgress`), and the interrupted run has rejected with
**exactly** `reason` (so the overridden call responds with `Method_Override`, not a
stray error).

**Why it holds (code-grounded).** `interrupt()` ends with `await this.currentRun`
(`Device.ts:489`); `currentRun` is `runPromise?.catch(()=>{})` (`Device.ts:492-494`),
and `runPromise` is the full chain `…race().catch().finally(clear).then()`
(`Device.ts:455-477`). The `.finally` that sets `runPromise = undefined` is part of
that chain, so `await this.currentRun` cannot resolve until `runPromise` is already
cleared. Therefore core's next-line `device.run()` always sees `runPromise ===
undefined` and proceeds. The interrupted run rejects via the `Promise.race` abort
branch with `signal.reason` (`Device.ts:457-459`), which the `.catch` re-throws
unchanged — so the reason is verbatim `Method_Override`.

**Tests:** `deviceOverrideDispatch.test.ts` drives the **real**
`Device.interrupt` → immediate `Device.run` (no reproduction of `onCallDevice`'s
bookkeeping) across the three in-flight states core can interrupt — a run blocked
in its `fn` body, blocked in `acquire()`, and parked before `acquire()` at
`await this.releasePromise` — asserting in each: the override `run()` does not
throw, the interrupted run rejected with `Method_Override`, and the device drains
with a balanced session ledger. A companion case asserts the other half of the
contract: a **non-override** second run on a busy device is rejected with
`Device_CallInProgress` (the `else if (device.currentRun)` branch). The existing
fuzz harness only checks runnability after a full drain; core re-runs on the next
microtask, so this immediate `interrupt → run` sequence is its own seam.

**Not an INV violation (corner not reachable in production).** Two _concurrent_
override-capable calls (two `setBusy`) to the same device have a timing-dependent
window where both pass the `if (method.overridden)` re-check and both reach
`device.run()`; the loser gets a `Device_CallInProgress` **response**. This is a
defined error response, not a hang/leak/stuck device (INV-4 recovery still holds —
the next call succeeds), and it is not reachable from normal usage (Suite never
fires two `setBusy` concurrently). Flagged here for completeness, not as a defect.
