# Device event router and firmware update service prototype

Status: planning checkpoint; implementation has not started.

Branch: `feat/device-event-router-prototype`, based on `origin/develop`.

This document records the current design discussion. It is intended to evolve in
small commits as the remaining decisions are made and the prototype is built.

## Goal

Move device connection and firmware update workflows out of Redux thunks and UI
components into stateful dependency-injected services. A single event router
receives Trezor Connect events and passes them through an ordered service
pipeline.

The prototype covers Suite Web and Desktop. Suite Native is outside its scope.

The prototype must demonstrate that a firmware update can own its target device
through disconnects, bootloader reconnects, THP interactions, and the final
reconnect without exposing intermediate device states to the normal connection
flow or Redux.

## Core invariants

- The router is the single entry point for Connect events entering Suite Web and
  Desktop.
- A device operation coordinator is the single entry point for Connect calls
  targeting a device and enforces an exclusive per-device lock.
- New business services do not import or call `TrezorConnect` directly. They
  receive an injected device-call gateway. Existing callers are intercepted by
  a temporary static bridge during migration.
- Business logic never uses `selectedDevice`. A device is always supplied
  explicitly to a command or resolved from local workflow state.
- Every device-targeted Connect call has an explicit device. Missing device
  context is an error rather than a reason to infer the selected device.
- Services own workflow state in memory. Redux may contain presentation and
  application configuration, but it does not contain the authoritative state of
  a connection or firmware workflow.
- A Redux update may request or describe UI, but it never drives a business
  transition.
- User commands, Connect events, and asynchronous operation results may all
  trigger state-machine transitions.
- PINs, THP credentials, and other secret responses never enter Redux or remote
  logging.
- A device owned by the firmware workflow does not enter the ordinary Redux
  device collection until ownership is deliberately handed off.
- The existing source may remain for reference, but the routed Web/Desktop path
  will not call `deviceConnectThunk` or the old Connect UI thunks.

## Proposed packages

The current package split is:

- `@suite-common/connect-event-router`
    - Connect event adapter and ordered handler pipeline.
    - In-memory device registry owned at ingress.
    - Immediate and deferred continuation primitives.
- `@suite-common/device-connection-service`
    - Manager for independent per-device connection state machines.
    - Normal connection workflow and the final Redux device projection.
- `@suite-common/device-operation`
    - Owns exclusive per-device operation locks.
    - Exposes the injected gateway that executes every device-targeted Connect
      call.
    - Has no Redux dependency and forms the shared foundation for connection,
      firmware, THP, authenticity, and wallet operations.
- `@suite-common/firmware-update-service`
    - Sole owner of the prototype firmware update workflow.
    - Kept separate from the existing Redux-oriented `@suite-common/firmware`
      package.
- `@suite-common/thp`
    - Gains a shared DI child-workflow service used by normal connection and
      firmware state machines.
    - Retains its legacy Redux thunks in source, but the new route does not use
      them.
- `@suite-common/device-authenticity`
    - Gains a DI child-workflow service for the pre-Redux authenticity gate.
    - Retains its legacy selected-device thunk in source, but the new route does
      not use it.

Services are created through the existing dependency-injection conventions and
wired in the Suite composition root.

## Outbound device operation coordination

The event router controls inbound Connect events. A separate device operation
coordinator controls outbound Connect method calls. Connection state machines
describe workflow state, while the coordinator prevents multiple operations
from using the same physical device concurrently.

Every device-targeted Connect call must pass through this coordinator. New
services use its injected gateway. Existing Web/Desktop callers continue using
the public Connect API during the prototype, but its patched static `call`
entrypoint delegates them to the same coordinator. Firmware therefore cannot
claim a device while an older signing, address-confirmation, or settings call is
active.

A device-targeted call without explicit device context is rejected with a typed
error before reaching Connect. It does not acquire a global compatibility lock
and never falls back to `selectedDevice`. Connect initialization, transport
management, and other operations that do not target a device remain outside the
per-device lock.

The composition root constructs the coordinator normally and installs it into a
set-once static bridge before Connect becomes usable. The bridge patches
`TrezorConnect.call` and delegates legacy calls to that instance. The coordinator
receives the captured original call implementation and uses it to avoid
recursing through the patch. Test teardown and hot reload explicitly uninstall
the bridge. The static reference is isolated to this infrastructure adapter and
can be removed after callers migrate to DI.

The coordinator maintains locks per device rather than one application-wide
lock. Independent devices may run operations in parallel. An incompatible call
against a locked device returns a typed `deviceBusy` result before reaching
Connect.

A lock is a workflow-scoped lease rather than a method-scoped mutex. A normal
connection machine holds one lease across THP and while waiting for the user to
start or resolve authenticity. Firmware holds one lease across preparation,
reboots, and every installation stage. Child workflows inherit the parent's
owner token instead of acquiring a competing lock. The lease is released only
when the workflow completes or is cancelled, or when disconnect or transport
loss revokes it.

A lease permits one primary device method at a time. While that method is
pending, only protocol-control calls correlated by its active `callId` may run,
including `uiResponse` and scoped cancellation. PIN, THP, and confirmation
responses can therefore unblock the primary method without allowing another
device operation to start. A second primary method remains blocked even when it
presents the same lease token; sequential workflow stages start it only after
the prior method finishes.

## Event router

The router subscribes to all Connect streams currently registered by
`connectInitThunk`:

- `DEVICE_EVENT`
- `UI_EVENT`
- `UI_REQUEST`
- `TRANSPORT_EVENT`
- `BLOCKCHAIN_EVENT`

It wraps each event in a typed envelope and invokes a static handler chain:

```text
Connect event
    -> ingress device registry update
    -> firmware update service
    -> standard device connection service
    -> root Suite projection
```

Handlers are independent and know only their own continuation, so another
handler can be inserted between firmware and standard connection handling.

Ordinary `next(event)` is synchronous, one-shot, and guarded against repeated or
late calls. A handler that assumes temporary ownership can request an explicit
one-shot deferred continuation. That continuation resumes the remaining chain
when ownership ends; it is not a retained ordinary `next` callback.

Envelope metadata such as `origin: 'firmware-handoff'` is diagnostic only. A
parent handler must not use it as a business instruction.

## Ingress device registry

The router adapter updates a neutral in-memory registry before routing each
device lifecycle event. The registry exposes a read-only DI interface and does
not use Redux.

The registry provides the current physical connection picture to both firmware
and normal connection workflows without making either service query the other.
It assigns a `connectionId` for tracking a normal connection workflow. The
firmware workflow preserves A's existing connection ID across its physical
disconnects and rebinds an accepted reconnect candidate to that ID. Normal
connections that cannot be correlated follow the registry's new-connection
rules.

Registry mutation requires a router-issued ownership lease. Firmware claims A
with its operation `callId` and receives a guarded lease. Only that live lease
may adopt a candidate, rebind its descriptor to A's connection ID, and release
ownership. Completing or cancelling the operation invalidates the lease, so a
delayed callback from stale work cannot change registry identity.

## Standard connection state machines

The connection service contains a state-machine manager keyed by
`connectionId`. The underlying architecture supports several devices and
several workflows progressing independently.

The normal product UI may expose only one connection workflow at a time. The
prototype UI may render independent workflows side by side to prove that the
service architecture supports parallel connections.

A representative connection sequence is:

```text
connected
    -> THP required?
    -> awaiting user start of device-authenticity check
    -> authenticity check running
    -> ready for normal Suite projection
    -> added to Redux device state
```

The exact state graph will use typed discriminated unions and exhaustive
transitions. Each user command includes `connectionId`; it never relies on the
selected device.

`connectionId` and Connect `callId` have separate lifetimes. A stable
`connectionId` identifies the state machine, while every Connect method started
by that machine receives a fresh `callId`. The manager maintains an index from
each active call ID to its owning connection. A late event from an earlier call
cannot satisfy a transition for a later method in the same workflow.

Each device permits at most one active operation. Commands that do not belong to
the current operation are rejected immediately with a typed `deviceBusy` result;
they are not queued. Connect events, UI responses, and effect completions that
belong to the active call remain valid inputs for that operation.

Transitions run synchronously to completion and never await. Asynchronous
effects return through new inputs tagged with their call ID and machine
generation. A small reentrancy guard may defer an input raised synchronously by
another transition, but there is no general asynchronous command mailbox.

A device disconnect is a terminal interrupt. At the next JavaScript turn it
invalidates the machine generation and all active call IDs, rejects pending UI
requests, discards deferred commands, removes temporary presentation state, and
destroys an unfinished connection machine. Any later result from invalidated
work is ignored. Other devices' machines continue independently.

A transport stop or failure is a broadcast terminal interrupt. The ingress
registry identifies every machine associated with the affected transport, and
the router delivers a `transportUnavailable` input to each one. Each affected
machine performs the same invalidation and cleanup as for an explicit device
disconnect; machines on other transports continue independently.

If a device disconnects before its normal connection workflow is complete, the
manager terminates that machine. It cancels active call IDs, rejects or clears
pending child-workflow requests, and removes the temporary UI projection. A
later physical connection starts a new workflow. Normal connection machines do
not guess identity across a disconnect; firmware is the explicit exception
because it owns a guarded lease and enters states that expect device reboots.

The user must explicitly start the Optiga/device-authenticity check. Until that
workflow reaches an accepted terminal outcome, the service publishes safe
presentation data to a dedicated UI slice but does not add the device to the
ordinary Redux device collection.

A successful authenticity result continues the connection workflow
automatically. A confirmed failure or inconclusive result stays in the
service-owned workflow until the user retries or explicitly continues. If the
user continues after a confirmed failure, the completed workflow projects both
the device and its failed-authenticity result into Redux. No partial device state
is projected into the ordinary device collection while the check is pending.

The authenticity service receives a narrow injected policy getter. Its Suite
implementation may read configuration through Redux selectors, including
feature gates and whether debug keys are allowed. The business service does not
depend on the store or selectors directly, and Redux does not contain the
connection process state. The workflow snapshots the returned policy when an
authenticity check starts so a configuration update cannot change the meaning of
an active check.

## Child workflows

THP and device authenticity are child workflows rather than peer router
middleware. The owning top-level state machine retains event ownership,
delegates relevant inputs to its active child, awaits the result, and then
continues its own transition.

The firmware and standard connection services use the same THP service from
`@suite-common/thp`. This removes the current duplication between ordinary
connection and firmware flows. The authenticity workflow similarly evolves the
existing `@suite-common/device-authenticity` package. No Redux thunk participates
in either new child workflow.

A child workflow follows this interaction model:

1. Store the pending Connect request and resolver in service memory.
2. Dispatch safe request metadata to Redux so the UI can render.
3. Let the user call a DI service method with the workflow ID and request ID.
4. Validate the command and send `TrezorConnect.uiResponse` synchronously from
   the service.
5. Resolve the local pending promise, clear the request, and resume the parent
   state machine.

## Firmware update workflow

The firmware service is a permanent first handler in the event chain. Its
internal state determines its routing behavior:

- While idle, it immediately calls `next`.
- While prepared or running, it owns relevant events and does not pass them to
  the normal connection service.

The prototype supports the standard offered upgrade for the device's current
firmware type. Custom firmware, reinstall, firmware-type changes, and devkit
variants are outside its scope.

Opening the prototype firmware modal calls `prepare(deviceA)`. Preparation:

- requires an explicitly supplied device;
- requires A to be the only connected device;
- generates a UUID used as the sole firmware operation `callId`;
- leaves A's last completed normal Redux projection frozen;
- starts event ownership before the install command is issued.

`install(callId)` starts `TrezorConnect.firmwareUpdate` with the same call ID.
UI requests and UI events carrying that call ID are owned exactly. A second
firmware operation is rejected with a typed already-running result.

The modal may cancel while prepared. Once installation starts, it is
non-dismissible, matching the current firmware UI. A scoped cancellation method
remains available for teardown and tests.

## Firmware reconnect identity

A firmware update includes several physical lifecycle changes:

```text
normal device
    -> disconnect
    -> bootloader reconnect
    -> firmware operation
    -> disconnect
    -> normal-mode reconnect
    -> possible additional firmware stage
```

Bootloader events may not contain a stable device ID, and Connect device paths
can change across reconnects. Therefore the service cannot always prove that a
reconnecting device is A.

The firmware workflow uses phase-gated singleton adoption. Preparation starts
with exactly one connected device. When the state machine explicitly expects A
to reconnect, it may adopt the sole compatible connected candidate as A. A
candidate that appears outside an expected reconnect state is not adopted.
Any additional physical device or conflicting evidence blocks the update.

After adopting a reconnect candidate, firmware rebinds its physical descriptor
to A's original `connectionId`. The stable connection identity belongs to the
logical workflow rather than to a temporary transport path or bootloader
descriptor. Rebinding is performed through the operation's ownership lease,
not through an unrestricted registry mutation API.

The proposed matching evidence is:

- expected firmware phase;
- exactly one connected candidate;
- compatible transport/API type;
- compatible model and other available descriptors;
- reconnect timing where useful.

Conflicting or ambiguous evidence causes a mandatory request to leave only the
upgraded device connected. This cannot detect a deliberate physical swap for a
sufficiently similar device during the identity gap.

## Additional-device behavior

Any device B connected while firmware is prepared or running is consumed by the
firmware handler and never passed to the normal connection service. The UI shows
a mandatory "Disconnect the other device" state. B's disconnect event is also
consumed, and the warning clears only when all unexpected devices are gone.

B is not replayed later. The user reconnects it after the firmware workflow has
released ownership.

This rule applies across transports. Connect itself maintains its internal
device list, so downstream routing cannot hide B from Connect. During an active
low-level firmware call, the service can block UI responses and final workflow
completion safely, but it cannot claim to pause bytes already being flashed.

## Firmware completion and handoff

Firmware-owned lifecycle events are reduced into one current snapshot of A.
When ownership ends, the service uses its deferred continuation to hand the
latest state to the remaining generic handler chain:

- `DEVICE.CONNECT` with the latest acquired snapshot;
- `DEVICE.CONNECT_UNACQUIRED` when acquisition remains incomplete; or
- `DEVICE.DISCONNECT` when A is currently disconnected.

Intermediate bootloader and UI events are not replayed. Work already completed,
including THP, is represented in the latest snapshot so the standard connection
state machine can continue from the current state.

Because the handoff carries A's preserved `connectionId`, the standard
connection manager resumes the existing completed machine. It refreshes the
normal Redux projection without discovering identity through Redux and without
repeating onboarding or authenticity checks.

Successful completion, failure, or cancellation updates a dedicated prototype
Redux UI slice. If another device is present, public completion and ownership
release wait until it is disconnected.

A normally connected A already has a completed Redux projection when firmware
preparation begins. That projection remains frozen throughout the update. The
firmware UI slice shows live progress, while transient disconnect, bootloader,
and reconnect states remain exclusively in service memory. Final handoff
refreshes the existing normal projection. This prevents a bootloader duplicate
from appearing in the device switcher and preserves account and UI context.

## Redux and UI

The new services may dispatch plain Redux actions that project presentation
state. They do not read workflow state from Redux. A narrowly typed injected
configuration getter may be backed by Redux selectors at the composition root.

The prototype uses dedicated slices in the existing Suite store rather than a
second Redux store instance. At minimum, the UI state must represent:

- connection ID or firmware call ID;
- current display phase;
- safe device display information;
- pending request metadata;
- recoverable error or final result;
- the mandatory additional-device warning.

Secrets and pending promise resolvers remain only in service memory.

The demonstration UI will live in Suite debug settings and work in both Web and
Desktop. It includes an explicit device picker for firmware preparation and may
show parallel normal connection flows in a split view.

## Existing integration points

Implementation will replace the Web/Desktop runtime entry path while preserving
old source for reference:

- `suite-common/connect-init/src/connectInitThunks.ts` will start the router
  instead of directly dispatching the five Connect event streams.
- `deviceConnectThunk` remains in source but becomes dead code for the new path.
- Existing Connect UI-response thunks are not used by the new workflows.
- Native keeps its current path.

The current global `TrezorConnect.call` override becomes the temporary static
bridge into the device operation coordinator. Its synchronization and post-call
cleanup behavior move behind the coordinator. Button-request cleanup resolves
the explicitly supplied `params.device.path`, with a focused test.
Device-targeted calls without that context fail instead of using a legacy
fallback.

## Known Connect constraints

- Firmware method UI events and requests carry the method `callId`.
- General device lifecycle events do not carry that `callId`.
- Connect's internal firmware reconnect logic currently uses
  `deviceList.getOnlyDevice(apiType)`. Two devices on the same transport type can
  prevent it from choosing A.
- Removing Suite event listeners does not remove devices from Connect's internal
  list.
- Disposing Connect would terminate the entire connection layer and the active
  firmware operation, so it is not a selective isolation mechanism.

## Prototype acceptance criteria

- Web and Desktop receive Connect events only through the router.
- Handler order and one-shot continuations are deterministic and tested.
- Several normal device connection state machines can exist concurrently.
- Every device-targeted Connect call passes through the per-device operation
  coordinator, while different devices can remain active in parallel.
- No device-targeted call reaches Connect without an explicit device, and no new
  business path reads `selectedDevice`.
- New business services use the injected device-call gateway. Legacy direct
  callers reach the same coordinator through the temporary static bridge.
- THP and device-authenticity flows use explicit IDs and local service state.
- No new service reads `selectedDevice` or Redux business state.
- A device is projected into normal Redux state only after required connection
  checks finish.
- Firmware preparation and installation use an explicitly supplied A and one
  call ID.
- Firmware owns A across normal-mode and bootloader reconnects.
- A's existing Redux projection remains stable during firmware ownership and is
  refreshed only by final handoff.
- Every B blocks firmware, remains outside Redux, and produces the mandatory UI
  state.
- Cancellation or failure hands one canonical current A snapshot to the
  remaining handler chain without requiring a physical replug.
- The debug UI demonstrates a real firmware flow and parallel normal connection
  workflows.

## Open decisions

1. Define the exact normal connection and firmware state graphs, including
   command validity and recovery transitions.
2. Define which safe device fields are projected into the pre-connection UI
   slice.
3. Decide how much of the prototype debug UI is retained when the architecture
   moves toward production.
