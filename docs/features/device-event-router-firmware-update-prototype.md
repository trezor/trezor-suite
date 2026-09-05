# Device lifecycle router and firmware update service prototype

Status: planning checkpoint; implementation has not started.

Branch: **feat/device-event-router-prototype**, based on **origin/develop**.

This document defines prerequisite work and then describes the prototype as if
those prerequisites were already complete. It replaces the earlier proposal in
which one router had to correlate every Connect event, legacy call, UI request,
device identity, and Redux interaction.

## Why prerequisites are necessary

The firmware problem is primarily a device-lifecycle ownership problem. During
an update, one logical device disconnects, appears in bootloader mode, disconnects
again, and returns in normal mode. Suite must keep that sequence out of the
ordinary connection flow until firmware deliberately hands the device back.

Today, unrelated concerns make that problem appear much larger:

- business logic can infer its target from Redux **selectedDevice**;
- device calls emit UI requests onto a global event stream;
- responses are often handled by Redux thunks outside the code that started the
  call;
- business code imports a static **TrezorConnect** singleton;
- call ownership, device identity, presentation state, and device locking are
  mixed together.

Building the router first would force it to compensate for all of those global
dependencies. It would need to route PINs, THP, confirmations, firmware progress,
legacy calls without correlation, lifecycle events, transport events, and
blockchain events. That is the source of most of the complexity in the earlier
design.

The prerequisite work makes every device call explicit and locally owned. Once
that is true, the router only needs to handle events that are genuinely global:
device lifecycle changes and transport loss.

## Prerequisite 1: remove selected device from business logic

**selectedDevice** remains valid presentation state. The UI may use it to decide
which device the user intends to act on, but it must pass that decision into the
business command explicitly.

```text
UI reads selectedDevice
    -> command({ connectionId, device, ...input })
    -> service validates the explicit target
    -> business workflow starts
```

The following code must not read **selectedDevice**:

- services and state machines;
- device-aware thunks that remain during migration;
- Connect call wrappers and cleanup;
- THP, authenticity, and firmware workflows;
- helpers that choose or reacquire a device.

A child operation receives the same explicit device context from its parent. It
does not reselect the device after an asynchronous boundary.

Completion criteria:

- every device-aware business entry point accepts an explicit device or
  **connectionId**;
- every child workflow receives that context explicitly;
- the Connect call cleanup uses the call's device rather than the currently
  selected device;
- an audit or architectural rule prevents new selected-device reads in
  device-aware business code.

## Prerequisite 2: make every device call locally owned

Every device-aware primary Connect call has a UUID **callId**. The workflow owner
creates it before starting the call and registers ownership before Connect can
emit an event.

Three identifiers have distinct lifetimes:

- **connectionId** identifies one logical device connection;
- **callId** identifies one primary Connect method invocation;
- **requestId** identifies one prompt and response within that call.

Connect UI requests, UI events, progress, and cancellation related to a method
are routed directly to the owner registered for that call ID. They do not enter
the device-lifecycle router.

```text
service starts call(device, callId)
    -> Connect emits UI request(callId, requestId)
    -> injected Connect service delivers it to the call owner
    -> owner stores the pending request in memory
    -> owner projects safe UI metadata to Redux
    -> user calls owner method(callId, requestId, response)
    -> owner sends the response to Connect
    -> original call continues
```

The pending promise, resolver, PIN, THP credential, and other secret inputs stay
inside service memory. Redux contains only safe presentation state. A UI command
with a stale call ID or request ID returns a typed error and cannot resolve a
newer request.

Call-scoped cancellation uses the same call ID. A late completion from a
cancelled call is ignored.

Completion criteria:

- every device-aware call supplies a call ID before execution;
- all call-scoped UI events reach the registered call owner;
- responses are handled by the service that owns the call;
- Redux thunks do not mediate PIN, THP, confirmation, or other Connect
  request-response mechanics;
- unowned or missing call IDs on device-call UI events are treated as contract
  violations rather than resolved through selected-device context.

Device lifecycle events do not carry method call IDs and remain outside this
mechanism.

## Prerequisite 3: inject Trezor Connect

Business code receives a dependency-injected adapter owned by Suite. Raw static
**TrezorConnect** access is confined to the adapter implementation and Connect
initialization infrastructure.

The adapter separates:

- global runtime and transport operations;
- device-aware primary methods requiring explicit device context and **callId**;
- correlated UI responses;
- scoped cancellation;
- call-local event delivery.

The adapter is an application service rather than the raw Connect singleton. Its
contract can therefore enforce Suite's invariants and can be replaced by a small
fake in tests.

The device-aware side of the adapter also owns per-device operation leases:

- one high-level workflow may own a device at a time;
- independent devices may run in parallel;
- a workflow holds its lease across all of its stages and while waiting for user
  interaction;
- a child workflow inherits its parent's lease;
- only one primary Connect method may be active under a lease;
- correlated **uiResponse** and cancellation control messages may run while that
  primary method is pending;
- another command for the same device returns a typed **deviceBusy** result;
- disconnect or transport loss revokes the lease and invalidates outstanding
  work.

Redux may mirror safe per-device and aggregate busy state for UI, but it cannot
grant or release a lease.

Completion criteria:

- new business code cannot import raw **TrezorConnect**;
- all device-aware calls use the injected service;
- the static Connect override and global synchronizer are no longer business
  coordination mechanisms;
- device locking and call ownership are testable without a Redux store;
- different devices are not serialized by one application-wide lock.

## Recommended prerequisite implementation order

The three prerequisites describe the required end state. The safest
implementation order is:

1. Introduce the injected Connect adapter while preserving behavior.
2. Add the explicit device and call-ID contracts.
3. Move call-scoped UI event delivery and responses behind the adapter.
4. Migrate device-aware business callers away from **selectedDevice**.
5. Enable per-device operation leases after all calls provide reliable device
   context.

Each step should have characterization tests and remain independently
reviewable. The firmware prototype begins only after all three prerequisite
completion criteria are satisfied.

## Assumed baseline for the prototype

The rest of this document assumes:

- business workflows never infer a device from Redux;
- every device-aware call has an explicit device and call ID;
- call-scoped UI and progress events are delivered locally to the call owner;
- responses are sent by that owner without Redux thunk mediation;
- every device-aware call uses the injected Connect service;
- per-device workflow leases prevent conflicting operations;
- **selectedDevice** is used only to choose presentation and command input.

This removes the need for a static legacy bridge, a legacy UI-event compatibility
handler, and firmware interception of unrelated Connect events.

## Prototype goal

Create a device-lifecycle router, a normal connection service, and a firmware
update service for Suite Web and Desktop.

The prototype must demonstrate that:

- normal device connections are owned by independent state machines;
- firmware takes temporary ownership of one explicit device A;
- A can reboot through bootloader and normal modes without intermediate device
  snapshots entering normal Redux state;
- any additional device B is withheld from the normal connection flow and
  produces a mandatory disconnect warning;
- the final state of A is handed back to the generic connection handler;
- no firmware or connection business decision uses Redux workflow state.

Suite Native is outside the prototype scope.

The prototype supports the standard offered upgrade for the device's current
firmware type. Custom firmware, reinstall, firmware-type changes, and devkit
variants are outside its scope.

## Event categories after the prerequisites

| Category            | Examples                                                | Owner                                              |
| ------------------- | ------------------------------------------------------- | -------------------------------------------------- |
| Call-scoped         | PIN, THP, confirmation, firmware progress, cancellation | Service that started the call, through **callId**  |
| Device lifecycle    | Connected, unacquired, changed, disconnected            | Device lifecycle router                            |
| Transport lifecycle | Transport stopped or failed                             | Transport adapter, normalized for affected devices |
| Other global events | Blockchain updates and global runtime status            | Existing dedicated application services            |

Only device lifecycle events enter the handler pipeline. Transport loss is
translated into a terminal input for every affected device. Blockchain events
and unrelated global UI events do not pass through firmware or connection
handlers.

## Proposed package boundaries

- **@suite-common/device-operation**
    - Injected Connect adapter.
    - Call-ID ownership and local event delivery.
    - Per-device workflow leases.
    - Correlated UI responses and cancellation.
- **@suite-common/device-event-router**
    - Device lifecycle event adapter.
    - Ordered handler pipeline.
    - In-memory device registry and connection identities.
- **@suite-common/device-connection-service**
    - Manager for independent normal connection state machines.
    - Final projection into the existing Redux device state.
- **@suite-common/thp**
    - Gains a reusable DI child workflow.
    - Legacy thunk source may remain, but the new path does not call it.
- **@suite-common/device-authenticity**
    - Gains a reusable DI child workflow.
    - Legacy selected-device thunk source may remain, but the new path does not
      call it.
- **@suite-common/firmware-update-service**
    - Sole owner of the prototype firmware update workflow.
    - Separate from the existing Redux-oriented **@suite-common/firmware**
      implementation.

All business packages live under **suite-common**. Suite Web/Desktop provides the
composition root and presentation adapters.

## Device lifecycle router

The router is the only Web/Desktop subscriber that turns Connect device
lifecycle events into Suite business inputs.

The static handler order is:

```text
Connect DEVICE_EVENT
    -> registry update
    -> firmware update handler
    -> normal connection handler
    -> root presentation adapter
```

Every handler receives each lifecycle envelope in order and may:

- forward the original envelope;
- forward an immutable replacement envelope;
- consume it;
- retain lifecycle ownership and later hand off one replacement envelope to the
  remaining chain.

Forwarding is one-shot. A replacement continues with the next handler and does
not re-enter the beginning of the router. Diagnostic ancestry may record that a
replacement came from firmware, but downstream business behavior never depends
on an **origin** flag.

Handlers do not know which handler comes next. Another handler can be inserted
between firmware and normal connection handling without changing either one.

Routing transitions are synchronous and never await. Asynchronous results return
to the owning state machine as explicit inputs.

## In-memory device registry

The lifecycle adapter updates a neutral registry before routing an event. The
registry is authoritative for current physical paths and logical
**connectionId** values. It does not read Redux.

The registry provides:

- current connected devices grouped by transport;
- exact path-to-connection lookup;
- stable connection IDs for ordinary connected sessions;
- transport association for termination;
- guarded firmware candidate adoption and identity rebinding.

An outbound device call must resolve to a currently known connection. Unknown
paths return a typed **unknownDeviceTarget** error.

Normal connection flows do not guess identity across disconnects. Firmware is
the only exception because it explicitly owns A, expects reboots, and begins
with exactly one physical device.

## Normal connection state-machine manager

The connection service holds one machine per **connectionId**. Machines for
different devices progress independently and use separate device-operation
leases.

A representative state graph is:

```text
observed
    -> acquiring
    -> awaiting THP interaction, when required
    -> evaluating authenticity policy
    -> awaiting user start, when a check is required
    -> authenticity call running
    -> awaiting failure decision, when required
    -> projected
    -> terminated
```

The exact discriminated union may split these states further, but every
transition must be exhaustive and accept only inputs valid for its current
state.

Connect calls started by the machine use the injected adapter. THP and
authenticity are child workflows that inherit the machine's explicit device
context and operation lease. Their UI request-response traffic remains local to
their call owner.

An unrelated command received while the machine owns its device returns
**deviceBusy**; commands are not queued.

A disconnect before projection terminates the machine. It revokes the lease,
cancels active calls, rejects pending UI requests, removes temporary
presentation state, and ignores later stale completions. A later physical
connection starts a new machine.

A transport stop or failure performs the same termination for every machine on
that transport. Machines on other transports continue.

## Device authenticity gate

The authenticity gate is policy-driven and independent of whether onboarding UI
is mounted.

- A new or unverified device waits outside the ordinary Redux device collection.
- The user explicitly starts the check.
- A known device with a still-valid accepted result may skip the check.
- A known device with a still-valid confirmed failure is projected immediately
  together with that failure so the compromised-device UI can block its use.

The authenticity service receives a narrow injected policy getter. Its Suite
implementation may read settings and feature configuration through Redux
selectors. This does not make Redux the connection state machine: the service
snapshots the returned policy when the check starts and never reads workflow
state from Redux.

Current result semantics are preserved:

- a valid proof stores a successful result;
- an invalid proof stores **{ valid: false, ...result }**;
- a Connect-level failure with an unlocked bootloader stores
  **{ valid: false, error }**;
- other Connect-level failures store **undefined** because failure was not
  established.

A confirmed failure or unavailable check remains in the local flow until the
user retries or explicitly continues. Continuing after confirmed failure
projects both the device and its failed result. Continuing after an unavailable
check projects no conclusive result, so a later reconnect remains eligible for
the gate.

The device enters the ordinary Redux device collection only after the connection
flow reaches one of these accepted terminal decisions.

## Parallel connection behavior and UI

The manager supports multiple connection machines even though the normal product
UI presents one connection flow at a time.

Every machine publishes safe UI state keyed by **connectionId**. Presentation
chooses which flow to show; business machines do not acquire a global UI slot and
do not read which flow is visible. A prototype split view may show several
pending flows side by side to demonstrate the underlying concurrency.

Safe presentation state may contain:

- **connectionId**;
- model and connection mode needed by the UI;
- current display phase;
- pending request kind and request ID;
- safe progress and error categories;
- per-device busy state.

PINs, THP credentials, device state secrets, promise resolvers, and raw
confidential identifiers are not copied into the prototype UI slice.

## Firmware update service

The firmware service is a permanent first handler in the lifecycle pipeline. Its
internal state determines its behavior:

- while idle, it forwards lifecycle events immediately;
- while prepared or running, it owns A's lifecycle and applies the additional
  device policy;
- call-scoped firmware UI and progress events arrive locally through the
  injected Connect service, not through this handler.

Opening the prototype modal calls **prepare(deviceA)** with an explicit device.
Preparation succeeds only when:

- A resolves to a ready, projected connection machine;
- A is the only physically connected device;
- no other operation holds A's device lease;
- no other firmware workflow is active.

Preparation creates the firmware call ID, then synchronously acquires two
separate capabilities:

- a device-operation lease for exclusive outbound use of A;
- a lifecycle-ownership lease for consuming lifecycle events and rebinding A's
  connection identity.

If either acquisition fails, preparation rolls back both. The original call ID
is the firmware workflow's public command ID and the ID of its primary
**firmwareUpdate** call.

The modal may cancel while prepared. Once installation starts, it is
non-dismissible, matching the current firmware UI. Scoped cancellation remains
available for controlled teardown and tests.

## Firmware lifecycle and identity

A representative lifecycle is:

```text
prepared in normal mode
    -> firmware call started
    -> waiting for disconnect
    -> waiting for bootloader
    -> installing
    -> waiting for disconnect
    -> waiting for normal mode
    -> possible additional Connect-managed stage
    -> completed
    -> handoff
```

Connect may omit stable identity in bootloader mode, and physical paths may
change. The service therefore uses phase-gated singleton adoption:

- preparation establishes A as the sole physical device;
- adoption is allowed only in a state that explicitly expects A to reconnect;
- exactly one compatible candidate must be present;
- available transport type, model, mode, and descriptor evidence must not
  conflict;
- ambiguous or conflicting candidates block progress.

An accepted candidate is rebound to A's original **connectionId** through the
lifecycle-ownership lease. The logical connection identity therefore survives
temporary bootloader paths and descriptors.

This cannot detect a deliberate physical swap for a sufficiently similar device
during the identity gap. Connect's current firmware reconnect behavior has the
same physical-singleton limitation.

## Additional device behavior

Any additional device B connected while firmware is prepared or running is
consumed by the firmware lifecycle handler.

- B is never passed to the normal connection manager.
- B is never added to Redux.
- The firmware UI shows a mandatory “Disconnect the other device” state.
- B's disconnect event is also consumed.
- Progress resumes only when no unexpected device remains.
- B is not replayed later; the user reconnects it after firmware finishes.

This applies across transports. A second device can interfere with Connect's
internal reconnect selection, especially when it shares A's transport type. The
service may safely withhold UI responses, starting a stage, or public completion,
but it does not claim to pause bytes already being flashed by an active
low-level call.

When B disconnects, the firmware machine reevaluates the current registry. If
exactly one compatible A candidate remains in an expected reconnect phase, it
may adopt that candidate and continue.

## Redux behavior during firmware

A normally connected A is already projected into Redux before firmware begins.
That last normal snapshot remains frozen throughout firmware ownership.

The firmware service publishes progress, prompts, blocking warnings, and final
results into a dedicated prototype UI slice. It never publishes bootloader or
intermediate reconnect snapshots into the ordinary device collection.

This is a central benefit of ownership:

- no duplicate bootloader device appears in the switcher;
- account and navigation context remain attached to A;
- normal business logic cannot react to a temporary firmware state;
- the firmware modal can represent the live process independently.

Redux may also hold application settings read through narrow injected getters.
The firmware and connection machines do not read their authoritative state from
Redux.

## Firmware handoff

Firmware reduces A's owned lifecycle events into one current snapshot. On
completion, failure, or cancellation, it hands one immutable replacement
envelope to the remaining handler chain:

- acquired **DEVICE.CONNECT** with the latest normal snapshot;
- **DEVICE.CONNECT_UNACQUIRED** if acquisition remains incomplete; or
- **DEVICE.DISCONNECT** if A is currently absent.

Intermediate bootloader events are not replayed. Work already completed, such as
THP, is represented by the latest snapshot.

The envelope keeps A's original **connectionId**, so the normal connection
manager resumes the existing projected machine and refreshes its Redux
projection. It does not rediscover identity through Redux or rerun onboarding
checks merely because firmware temporarily changed the physical path.

Diagnostic metadata may record that the envelope is a firmware handoff.
Downstream handlers remain generic and never branch on that origin.

If B remains connected, public completion and ownership release wait until B is
removed.

## Redux and command boundary

The prototype uses dedicated presentation slices in the existing Suite store,
not a second Redux store instance.

Services may dispatch plain presentation actions. User interaction calls a DI
service method with explicit identifiers:

```text
UI renders state from Redux
    -> user acts
    -> service.command({ connectionId or callId, requestId, value })
    -> service validates current state
    -> local state-machine transition
    -> optional call-local response to Connect
    -> updated presentation action
```

Redux actions do not resolve Connect promises and reducers do not decide the
next workflow transition.

## Web/Desktop integration

The prototype replaces the Web/Desktop connection entry path:

- Connect initialization registers the device lifecycle router.
- Call-scoped events remain inside the injected Connect adapter.
- The router invokes the firmware handler and normal connection service.
- **deviceConnectThunk** and the old UI-response thunks remain in source for
  reference but are dead on the new path.
- Existing production firmware source remains present and separate.
- The prototype UI is added to Suite debug settings and uses explicit device
  commands.
- Native keeps its current implementation.

There must be no period where both the old listener path and the new router
process the same lifecycle event.

## Prototype implementation sequence

Assuming the three prerequisites are complete:

1. **Router and registry**
    - Create the lifecycle envelope and ordered handler contract.
    - Add the in-memory registry and transport termination.
    - Start with a root adapter and prove each lifecycle event is handled once.
2. **Shared child workflows**
    - Add DI THP and authenticity workflows using the already local call-session
      API.
    - Preserve existing authenticity result semantics.
3. **Normal connection manager**
    - Implement one machine per connection ID.
    - Project devices only after required checks reach an accepted decision.
    - Demonstrate two independent connection flows in tests.
4. **Normal connection cutover**
    - Replace the runtime call to **deviceConnectThunk**.
    - Keep the old source but ensure it is unreachable from the new listener.
5. **Firmware service**
    - Add preparation, leases, lifecycle ownership, singleton adoption, B
      blocking, cancellation, and canonical handoff.
6. **Debug UI**
    - Add an explicit A picker and firmware controls.
    - Add optional split presentation for parallel normal connection flows.
7. **Web/Desktop integration verification**
    - Prove there is one lifecycle ingress.
    - Exercise real or emulated normal connection and firmware reconnect flows.

All new **suite-common** behavior follows the repository's TDD requirement:
write focused failing tests, implement the smallest transition, and refactor
only after the tests pass.

## Required tests

### Injected Connect and call sessions

- explicit device and call-ID enforcement;
- local delivery of UI requests and progress;
- request-ID validation;
- stale response and stale completion rejection;
- one primary call plus correlated control messages;
- per-device exclusion and cross-device concurrency;
- disconnect and transport-loss revocation.

### Router and registry

- deterministic handler order;
- one-shot forwarding;
- immutable event replacement;
- consumed events never reach later handlers;
- path and transport lookup;
- connection-ID preservation;
- transport-loss fan-out;
- guarded firmware adoption and rebinding.

### Normal connection

- parallel machines do not share state;
- unrelated commands return **deviceBusy**;
- THP and authenticity child transitions;
- no ordinary Redux device before an accepted terminal decision;
- current authenticity success, failure, and unavailable-result semantics;
- disconnect cleanup and stale result rejection.

### Firmware

- idle forwarding;
- preparation preconditions and transactional lease acquisition;
- explicit A ownership without selected-device reads;
- normal-to-bootloader-to-normal rebinding;
- conservative handling of ambiguous candidates;
- B consumption, warning, and disconnect recovery;
- frozen Redux device projection;
- successful, failed, and cancelled canonical handoff;
- no intermediate bootloader projection;
- call-local firmware UI and progress behavior.

## Prototype acceptance criteria

- The three prerequisites are complete before router implementation begins.
- Web and Desktop have one device lifecycle ingress.
- Device-aware calls and UI responses remain local to their call owner.
- New business logic does not read **selectedDevice** or import raw
  **TrezorConnect**.
- Several normal connection machines can exist independently.
- Per-device leases block conflicting calls without serializing other devices.
- THP and authenticity run as reusable child workflows.
- A device enters normal Redux only after required checks finish.
- Firmware owns explicit A across bootloader and normal reconnects.
- A's normal Redux snapshot remains stable during the update.
- Every B is withheld from normal connection handling and produces the
  mandatory warning.
- Firmware releases one canonical current state to the remaining generic
  handler chain.
- The debug UI demonstrates the workflow without integrating the old production
  firmware components.

## Explicitly removed from the earlier design

The prototype no longer requires:

- routing all five Connect event streams through one middleware pipeline;
- allowing firmware to inspect blockchain or unrelated application events;
- a static bridge from legacy Connect calls into a new coordinator;
- a legacy call-ID compatibility handler in the router;
- selected-device fallback for unscoped UI events;
- router-level handling of PIN, THP, confirmation, or firmware progress;
- solving legacy calls without call IDs inside the firmware prototype.

Those responsibilities disappear because the prerequisite migration makes
device-aware calls explicit, correlated, injected, and locally owned before the
prototype starts.
