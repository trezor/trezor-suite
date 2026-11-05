# WARD relay protocol, version 1.0

The contract between `wardd` (the WARD host) and every host library that talks to a Trezor:
Connect and HWI. The types are in `@trezor/ward/relay` (`packages/ward/src/relay`).

## Who does what

```
wallet app ──► host library (HWI or Connect) ──► WARD adapter ──► wardd ──► Evolu
                      │                                              └────► WARD Manager
                      └──── device session ──── Trezor
```

- **wardd implements every WARD flow:** sync, lookup, update, the proofs it serves, the storage
  (Evolu) and the WARD Manager.
- **The WARD adapter only relays.** It has two hooks:
    - **relay:** put wardd's next message on the device session and return the device's final
      answer.
    - **onProofRequest:** answer the device's mid-call `WARDProofRequest` with wardd's `answerProofRequest`.
- **The host library** holds the device session and exposes the wallet-facing calls
  (`ward_lookup`, `ward_update`, `ward_verify`, address display).

## Transport

- **Connect** calls `Wardd` in-process (`wardd` in Connect's settings).
- **HWI** reaches a running wardd over a WebSocket on `127.0.0.1`, default port 21329, with text
  frames of one JSON object each.
    - **Browser clients** are checked against an origin allow-list, as for Trezor Bridge.
    - **Every client** sends the pairing token in `hello` first. The token is in a file readable
      only by the user (`~/.trezor-ward/token` by default).
- **Encoding:** protobuf messages travel by name with a JSON body: snake_case fields, bytes as
  lowercase hex, absent fields omitted. A host library needs no WARD logic, only a map from a
  name to its own message type.

## Frames (WebSocket)

```
client → wardd   { "id": 1, "method": "lookup", "params": { … } }
wardd  → client  { "id": 1, "deviceCall":  { "name": "WARDSync", "message": {} } }
client → wardd   { "id": 1, "deviceReply": { "name": "WARDSyncAck", "message": { … } } }
   … repeated …
wardd  → client  { "id": 1, "deviceCall":  { "name": "WARDLookup", "message": { … } } }
client → wardd   { "id": 2, "method": "answerProofRequest", "params": { "request": { "entry_key": "…" } } }
wardd  → client  { "id": 2, "result": { "proof": [ … ], … } }
client → wardd   { "id": 1, "deviceReply": { "name": "WARDLookupAck", "message": { … } } }
wardd  → client  { "id": 1, "result": { "valid": true, "isMember": true, … } }
```

- **A conversation holds the device session.** Every `deviceCall` gets exactly one `deviceReply`,
  and wardd sends nothing more for that `id` until it arrives.
- **The device's pull is answered with a nested call, not a reply.** When the device raises
  `WARDProofRequest` inside a `deviceCall`, the adapter calls `answerProofRequest` on the same endpoint and
  answers the device itself; the `deviceReply` is the device's final answer.
- **A device `Failure` is a `deviceReply`** too. wardd ends the call with `device_failure`.
- **Only WARD messages:** an adapter refuses a `deviceCall` for anything outside the WARD flows,
  so whatever answers on the wardd port cannot drive the wallet.

## Methods

| method               | params                                                           | result                                                   | conversation                    |
| -------------------- | ---------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------- |
| `hello`              | `{ version, token }`                                             | `{ version, wardd }`                                     | no; WebSocket only, first frame |
| `sync`               | `{ wardId? }`                                                    | `{ wardId, counter, root }`                              | yes                             |
| `lookup`             | `{ appId, address, networkSymbol, wardId? }`                     | `{ wardId, valid, isMember, counter, metadata? }`        | yes                             |
| `update`             | `{ appId, address, networkSymbol, metadata?, delete?, wardId? }` | `{ wardId, counter, root, conflict?, localCacheError? }` | yes                             |
| `answerProofRequest` | `{ request }` (a `WARDProofRequest` body)                        | a `WARDProofAck` body                                    | no                              |
| `status`             | `{}`                                                             | `{ wardId, counter, root }`                              | no                              |

- **`sync`** runs `WARDSync` → the WM attests wardd's stored head → `WARDIngestAttestation` →
  `WARDReconcile`. Every other conversation starts with it.
- **`lookup`** sends `WARDLookup` with no proof; the device pulls it and gives its verdict.
  `metadata` (the stored label) is returned only for a membership the device proved.
- **`update`** runs `WARDQueueUpdate` (the user confirms) → `WARDPerformUpdate` (the device pulls
  the pre-state proof and seals the leaf) → the WM's commit signature → `WARDConfirmedByWM`, then
  stores the leaf and the transition. On a WM conflict it sends `WARDDiscardPending` and returns
  `conflict: true`.
- **`answerProofRequest` and `status`** act on the wallet the endpoint last synced.
- **One conversation at a time** across all endpoints of one wardd.

## Errors

`{ id, error: { code, message } }`, with one of these codes:

- `bad_request`
- `unauthorised`: wrong origin or token
- `version_mismatch`: a different major version
- `no_store`: `answerProofRequest` or `status` before any `sync`
- `device_failure`: the device answered with `Failure`, or could not be reached
- `ward_id_mismatch`: the device's ward_id is not the one the caller named
- `internal`

## Versioning

`major.minor`. A minor bump only adds optional fields or methods. A client and wardd with
different major versions refuse each other at `hello`.
