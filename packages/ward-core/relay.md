# WARD relay

Connect, HWI, BHWI, async-hwi and Lark can use one local WARD service. The wallet integration
relays each conversation on the same unlocked device session.

## Connection and authority

The service listens on loopback, checks browser origins and requires an installation pairing token
and a compatible major relay version. A separate WARD credential derived from the wallet's Evolu
credential opens the persistent replica. Authenticated clients can reuse a store already open in
the daemon.

Connect lets the caller select the endpoint that receives the replica credential. It can also
forward device requests beyond the selected WARD operation. The integration therefore trusts that
endpoint with both replica access and device requests.

## Operations

| Operation                       | Result                                                                                                                                    |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Read                            | The device checks the supplied entry or proof of absence against its selected root.                                                       |
| Publish or flush                | The service coordinates publication of an authorized write or queued changes. A flush syncs the device after publication.                 |
| Sync                            | With a manager, the device verifies a live attestation and wallet history. In the MVP it verifies and persists a chain from its own head. |
| Catch up without a live manager | A manager-backed device requires cached manager evidence for the proposed head.                                                           |
| Status                          | The service reports its replica position and, when available, the manager's position.                                                     |

A reply timeout can occur after a write lands. A successful sync establishes the accepted head.
See [the local service](../wardd/README.md#publication) for publication and receipt handling.
