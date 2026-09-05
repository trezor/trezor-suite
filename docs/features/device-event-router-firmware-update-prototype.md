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
- Business logic never uses `selectedDevice`. A device is always supplied
  explicitly to a command or resolved from local workflow state.
- Services own business state in memory. Redux contains presentation state only.
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
- `@suite-common/firmware-update-service`
    - Sole owner of the prototype firmware update workflow.
    - Kept separate from the existing Redux-oriented `@suite-common/firmware`
      package.
- A shared THP child-workflow service, with its exact package location still to
  be decided.
- A device-authenticity child-workflow service, with its exact package location
  still to be decided.

Services are created through the existing dependency-injection conventions and
wired in the Suite composition root.

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
precise rules for preserving or replacing that ID over physical reconnects will
be defined with the state-machine model.

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

The user must explicitly start the Optiga/device-authenticity check. Until that
check succeeds, the service publishes safe presentation data to a dedicated UI
slice but does not add the device to the ordinary Redux device collection.

## Child workflows

THP and device authenticity are child workflows rather than peer router
middleware. The owning top-level state machine retains event ownership,
delegates relevant inputs to its active child, awaits the result, and then
continues its own transition.

The firmware and standard connection services use the same THP service. This
removes the current duplication between ordinary connection and firmware flows.
No Redux thunk participates in THP.

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

The agreed safety boundary is that firmware preparation starts with exactly one
connected device and any additional physical device blocks the update. The
remaining open decision is whether a sole compatible device may be adopted as A
only while the firmware state machine is explicitly expecting a reconnect.

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

Successful completion, failure, or cancellation updates a dedicated prototype
Redux UI slice. If another device is present, public completion and ownership
release wait until it is disconnected.

## Redux and UI

The new services may dispatch plain Redux actions that project presentation
state. They never read Redux to make a workflow decision.

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

The global `TrezorConnect.call` wrapper and synchronizer remain. Its post-call
button-request cleanup currently resolves the selected device. The prototype
will narrowly change that cleanup to resolve the explicitly supplied
`params.device.path`, with a focused test and a legacy fallback only for calls
that genuinely have no explicit device.

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
- THP and device-authenticity flows use explicit IDs and local service state.
- No new service reads `selectedDevice` or Redux business state.
- A device is projected into normal Redux state only after required connection
  checks finish.
- Firmware preparation and installation use an explicitly supplied A and one
  call ID.
- Firmware owns A across normal-mode and bootloader reconnects.
- Every B blocks firmware, remains outside Redux, and produces the mandatory UI
  state.
- Cancellation or failure hands one canonical current A snapshot to the
  remaining handler chain without requiring a physical replug.
- The debug UI demonstrates a real firmware flow and parallel normal connection
  workflows.

## Open decisions

1. Confirm phase-gated singleton adoption for identifying A during expected
   firmware reconnects.
2. Choose the package boundaries for the shared THP and device-authenticity
   child-workflow services.
3. Define the exact normal connection and firmware state graphs, including
   command validity and recovery transitions.
4. Define which safe device fields are projected into the pre-connection UI
   slice.
5. Decide how much of the prototype debug UI is retained when the architecture
   moves toward production.
