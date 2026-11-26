# The local WARD service

wardd runs separately from Suite desktop on the machine connected to the Trezor. It stores encrypted
changes in an Evolu replica and rebuilds the wallet tree to serve proofs. Wallet integrations reach
it through the [WARD relay](../ward-core/relay.md).

## Publication

With a manager, wardd stores the encrypted change and submits it for acceptance. Saving the
manager's receipt is a separate step that can fail after the change lands. A client relaying the
device can request an immediate sync to verify the accepted head. A missing receipt can limit later
recovery.

In the manager-free MVP, wardd verifies the wallet's publication signature and stores the change.
Concurrent writers can produce different valid histories.

## Deployment

wardd can use a local development manager or contact a separate manager. Debug devices and emulators
trust the development key. Release devices currently reject manager attestations. After a manager
restore, a compatible wallet-channel client can coordinate recovery with a Trezor that remembers a
later head. The deprecated dedicated interface lacks that recovery path.

See the [operations guide](OPERATIONS.md) for configuration.
