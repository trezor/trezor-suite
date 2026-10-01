# WARD relay protocol, version 1.0

This is the contract between `wardd` (the local WARD service) and every integration that talks to
a Trezor: Connect, HWI (Python), BHWI and async-hwi (Rust), and Lark (Java). The types are in
`src/relay.ts`.

**What sits where:**

- **`wardd` holds all the WARD logic:** the replica (in Evolu), proofs, the transition log, the
  WM, and the order of every sync, catch-up and flush.
- **An integration** only moves messages between `wardd` and the device, on the device session it
  already holds.

## Transport

- **Socket:** a WebSocket on `127.0.0.1`, default port 21329. Text frames, one JSON object per
  frame.
- **Authentication:**
    - **Browser clients** are checked against an origin allow-list, the same as Trezor Bridge's.
    - **Every client** must send the pairing token in `hello`. The token is in a file readable only
      by the user, or handed over by whatever launches `wardd`.
- **Encoding:** protobuf messages travel **by name**, with a JSON body in which bytes are lowercase
  hex. A binding needs no WARD protobuf definitions; it maps a name to its own message-type ID only
  where it writes to the device.

## Frames

```
client → wardd   { "id": 1, "method": "sync", "params": {} }
wardd  → client  { "id": 1, "deviceCall":  { "name": "WardSync", "message": {} } }
client → wardd   { "id": 1, "deviceReply": { "name": "WardSyncAck", "message": { … } } }
   … repeated …
wardd  → client  { "id": 1, "result": { "counter": 5, "root": "…" } }
```

- **A call is one conversation.** While it runs, the client holds its device session
  exclusively. It answers every `deviceCall` with exactly one `deviceReply`, and `wardd` sends
  nothing more for that `id` until then.
- **Device-initiated pulls are just replies.** If the device answers with `WardEntryRequest` or
  `WardChainRequest`, the client sends that as the `deviceReply`. `wardd` answers with the next
  `deviceCall` (`WardEntryAck` or `WardChainLinkAck`).
- **A device `Failure` is also a `deviceReply`.** `wardd` ends the call with `device_failure`.
- **The session must be the unlocked wallet session.** WARD roots are per wallet (per
  passphrase), so the conversation must run on the session the user unlocked.

## Methods

| method        | params                                     | result                                    | conversation                               |
| ------------- | ------------------------------------------ | ----------------------------------------- | ------------------------------------------ |
| `hello`       | `{ version, token }`                       | `{ version, wardd }`                      | no; must be the first frame                |
| `openStore`   | `{ wardId, evoluNode }`                    | `{ counter, root }`                       | no                                         |
| `serveEntry`  | `{ request, staged? }`                     | `WardEntryAck` body                       | no (used by Connect's `wardProvider` hook) |
| `applyResult` | a `WardLeafAck` / `WardFlushQueueAck` body | `{ counter, root, published }`            | no                                         |
| `sync`        | `{ rejoin? }`                              | `{ counter, root, how }`                  | yes                                        |
| `flush`       | `{ maxBatch? }`                            | `{ counter, root, published, remaining }` | yes                                        |
| `status`      | `{}`                                       | `{ counter, root, wmCounter, wmRoot }`    | no                                         |

**Evolu key hand-off (`openStore`):** `evoluNode` is the SLIP-21 node the device returns from
`EvoluGetNode`. The client gets it through its normal delegated-identity flow and passes it on.
`wardd` derives its own WARD owner from it (`['TREZOR','Evolu','WARD']`), separate from Suite's.

## Errors

Each error is `{ id, error: { code, message } }`, with one of these codes:

- `bad_request`
- `unauthorised`: wrong origin or token
- `version_mismatch`: a different major version
- `no_store`: `openStore` hasn't run
- `device_failure`
- `wm_conflict`: another writer moved the WM head first; retry after `sync`
- `wm_behind`: the WM holds a head below the device's (its register regressed); needs a rollback
- `needs_rejoin`: the device's head is off the WM's history; the user must confirm `sync` with
  `{ rejoin: true }`, which discards the device's changes above the fork
- `internal`

## Versioning

`major.minor`. A minor bump only adds optional fields or methods. A client and `wardd` with
different major versions refuse each other at `hello`.
