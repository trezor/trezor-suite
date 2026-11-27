# The local WARD service

wardd runs separately from Suite desktop on the machine connected to the Trezor. It stores encrypted
changes in its local Evolu database, which Evolu synchronizes between hosts, and rebuilds the wallet
tree from the records its host has received to serve proofs. Wallet integrations reach
it through the [WARD relay](../ward-core/relay.md).

## Publication

With a manager, wardd stores the encrypted change and submits it for acceptance. Saving the
manager's receipt is a separate step that can fail after the change lands. A client relaying the
device can request an immediate sync to verify the accepted head. A missing receipt can limit later
recovery.

In the manager-free MVP, wardd verifies the wallet's publication signature and stores the change.
Concurrent writers can produce different valid histories.

## Storage on Suite Sync

The production Suite Sync relay admits an Evolu owner only while the Quota Manager holds storage for
it, and refuses writes beyond that storage. wardd's records live under a WARD owner of their own,
derived from the wallet's Evolu node, so that owner needs storage too. Whoever holds the device's
delegated Suite Sync key funds it from the device's quota, with the same signed request Suite uses
for its own owner. wardd never holds that key.

wardd reports in its status whether its records reach other hosts. When they do not, it says why
(no storage, storage used up, relay unreachable), how many local records wait, and how many bytes
the owner needs. A refused write is never a failed write: the record stays stored here and is
published, and the waiting records go out once the owner has storage again. wardd synchronizes an
owner only after the Quota Manager reports storage for it, and resynchronizes when the storage
grows.

## Deployment

wardd can use a local development manager or contact a separate manager. Debug devices and emulators
trust the development key. Release devices currently reject manager attestations. After a manager
restore, a compatible wallet-channel client can coordinate recovery with a Trezor that remembers a
later head. The deprecated dedicated interface lacks that recovery path.

See the [operations guide](OPERATIONS.md) for configuration.
