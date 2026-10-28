# Suite Sync

Suite Sync synchronizes wallet labels (wallet, account, address and output labels) between Suite instances that use the same wallet. It replaces the legacy [metadata labeling](./metadata.md) providers.

Sync is built on [Evolu](https://www.evolu.dev/), a local-first library. Every Suite instance keeps its own local database and exchanges end-to-end encrypted changes through a **relay** server. Access to the relay is limited by a **quota** granted by the **Quota Manager** server. The quota is granted only to genuine Trezor devices.

This page describes how it works: the terms, keys and proofs involved and the flow how Suite obtains them.

## Terms

### Wallet

Just to be clear, wallet means here a seed together with an optional passphrase, identified in Suite by its `StaticSessionId`. Each wallet syncs separately, one Trezor Wallet = separate Evolu Owner (User), so a hidden wallet has its own sync data, unrelated to the standard wallet on the same device.

### Delegated Identity Key

A P-256 private key that the device gives to Suite (`evoluGetDelegatedIdentityKey`). Suite stores one per **device** (`deviceId`), not per wallet.

The device delegates its identity to Suite through this key. With it, Suite can sign statements that mean "this request is authorized by this Trezor" without asking the device each time. The key is used in two ways:

- The device trusts proofs signed with it when it is asked to release secrets or to sign a registration request.
- The Quota Manager identifies the device by the matching **public** key. The private (Delegated Identity) key never leaves the Trezor Suite.

### Proof of Delegated Identity

A P-256 signature made with the Delegated Identity Key over `len(header) ‖ header ‖ payload` (`getProofOfDelegatedIdentity`). The header separates proofs made for different purposes:

| Header                         | Payload                                      | Verified by   | Purpose                                |
| ------------------------------ | -------------------------------------------- | ------------- | -------------------------------------- |
| `EvoluGetNode`                 | none                                         | device        | Release the Suite Sync Owner secret    |
| `EvoluSignRegistrationRequest` | server challenge, requested size             | device        | Sign the device registration request   |
| `EvoluAddSpaceToOwnerV1`       | public key, owner ID, server challenge, size | Quota Manager | Move quota from the device to an owner |

### Suite Sync Owner

The identity of one **wallet** in Suite Sync, called an _owner_ in Evolu terms. It consists of:

- `ownerSecret`: the SLIP-21 node at path `['TREZOR', 'Evolu']`, returned by the device (`evoluGetNode`). It is derived from the wallet secret (seed + passphrase).
- `ownerId`: a public identifier derived from `ownerSecret`.

Owners are not generated randomly. They are derived deterministically, so the same wallet produces the same owner on every Suite instance, and that is what lets instances find each other's data on the relay. Suite derives three Evolu keys from `ownerSecret` with SLIP-21 (`createEvoluAppOwnerFromTrezorData`):

| Key                  | Purpose                                                    |
| -------------------- | ---------------------------------------------------------- |
| `OwnerIdBytes`       | Becomes `ownerId`, the public identifier used on the relay |
| `OwnerEncryptionKey` | End-to-end encrypts data sent to the relay                 |
| `OwnerWriteKey`      | Authorizes writes to the owner's data on the relay         |

The Trezor node already includes the `Evolu` segment in its path, so Suite derives these keys directly from it instead of using Evolu's default `createAppOwner`. See the firmware side in [`get_node.py`](https://github.com/trezor/trezor-firmware/blob/main/core/src/apps/evolu/get_node.py).

### Storage

Suite's abstraction over one Evolu instance, one per wallet.
It is possible to have a storage exist locally only, without a relay connection. Labels then work on this Suite instance but are not synchronized.

### Relay

The Evolu sync server (`https://suite-sync.trezor.io/evolu/` in production; an onion address is used when Tor is enabled).
The user can change it in settings.
The relay sees only `ownerId`, encrypted data and some [metadata - see Evolu documentation](https://www.evolu.dev/docs/privacy#relay-blindness-by-design).

### Quota Manager

The server that decides how much relay storage each owner may use. Quota is granted in two levels:

- **Device quota:** granted once when a genuine device is registered, and tied to the device's delegated public key.
- **Owner quota:** a part of the device quota moved to a specific owner. Only owners with quota are connected to the relay.

### Read mode and write mode

Each activation of Suite Sync for a wallet runs with an `isWriteMode` flag:

- **Write mode** (`true`): if the owner has no quota, Suite allocates it.
- **Read mode** (`false`): if the owner already has quota, the storage is connected to the relay. Otherwise, it stays local only.

Quota is spent the first time the user writes/edits a label.
Wallets that are only viewed do not use any quota – prevents accidental quota depletion when discovering a wrong passphrase.

## Flow

Everything goes through `ensureWalletSuiteSyncOn({ deviceStaticSessionId, isWriteMode })`. Each step checks whether its result already exists, so repeated calls are cheap and the device is only needed the first time.

```text
ensureWalletSuiteSyncOn
├─ eligibility: firmware supports Evolu, device has state
└─ ensureStorage
   ├─ 0. cached storage and owner has quota? ─────────────────────► done
   ├─ 1. ensureSuiteSyncKeys
   │     ├─ 1a. Delegated Identity Key  ── evoluGetDelegatedIdentityKey
   │     └─ 1b. Suite Sync Owner        ── evoluGetNode + proof "EvoluGetNode"
   ├─ 2. create local storage (Evolu instance, no relay)
   ├─ 3. ensureQuota
   │     ├─ 3a. device registration     ── evoluSignRegistrationRequest
   │     │                                  + proof "EvoluSignRegistrationRequest"
   │     └─ 3b. owner quota allocation  ── proof "EvoluAddSpaceToOwnerV1"
   │                                        (write mode only, no device call)
   ├─ 4. connect storage to the relay (only if the owner has quota)
   └─ 5. subscribe storage tables to Redux
```

### 0. Cached storage

If a storage for the wallet already exists and Redux records that the owner has quota, it is returned and nothing else runs.

### 1. Keys

Code: `createEnsureSuiteSyncKeys`.

**1a. Delegated Identity Key.** If the key is cached, Suite decrypts it. Otherwise, Suite calls `evoluGetDelegatedIdentityKey` on the device, then encrypts and stores the result.

**1b. Suite Sync Owner.** If the owner is cached, Suite decrypts it. Otherwise:

1. Suite signs the `EvoluGetNode` proof with the delegated key.
2. Suite calls `evoluGetNode({ proof_of_delegated_identity })`. The device verifies the proof and returns the wallet's SLIP-21 node.
3. Suite derives `ownerId` from the node, then encrypts and stores the owner.

The device releases the owner secret only to a client holding the delegated key it issued.

### 2. Local storage

Suite creates the Evolu instance from the owner, without any transport. From this point, labels for the wallet work locally.

### 3. Quota

Code: `suite-common/suite-sync-quota-manager`. This step is skipped if Redux records that the device is registered and the owner has quota.

**3a. Device registration** (`createEnsureDeviceHasQuota`, `createRegisterDevice`). Suite asks the Quota Manager whether the delegated public key already has quota. If not:

1. Suite requests a challenge from the Quota Manager.
2. Suite signs the `EvoluSignRegistrationRequest` proof over the challenge and the requested size.
3. Suite calls `evoluSignRegistrationRequest({ challenge_from_server, size_to_acquire, proof_of_delegated_identity })`. The device returns a signature and its attestation certificate chain (device certificate and CA certificate), plus a `rotation_index` on firmware 2.12.2 and newer.
4. Suite sends the certificate chain, signature, challenge and delegated public key to the Quota Manager.

The certificate chain proves to the server that a genuine Trezor signed the request. The server then binds the delegated public key to that device and grants it the device quota. Registration happens once per device and runs in read mode too.

**3b. Owner quota allocation** (`createEnsureOwnerHasAllocatedQuota`, `createAllocateOwnerQuota`). Suite asks the Quota Manager whether `ownerId` already has quota. If not, and Suite Sync runs in write mode:

1. Suite requests a new challenge.
2. Suite signs the `EvoluAddSpaceToOwnerV1` proof over the public key, `ownerId`, challenge and size.
3. Suite asks the Quota Manager to move that amount from the device quota to the owner.

The device is not involved. The delegated key alone authorizes spending the device quota. If the device has no quota left, nothing is allocated and Suite shows a banner. In read mode, Suite stops here with `WriteModeRequiredForAllocation`, which is not treated as an error.

### 4. Relay connection

Only if the owner has quota, Suite connects the storage to the relay. Evolu then synchronizes the data, encrypted with `OwnerEncryptionKey`.

### 5. Subscription

Suite subscribes to the storage tables (`wallets`, `accounts`, `addresses`, `outputs`) and mirrors them into Redux (`suiteSyncData`).

## Device calls

| Trezor Connect method          | When                                   | Scope      | Returns                                      |
| ------------------------------ | -------------------------------------- | ---------- | -------------------------------------------- |
| `evoluGetDelegatedIdentityKey` | Delegated key not cached               | per device | Delegated Identity Key (private)             |
| `evoluGetNode`                 | Owner not cached                       | per wallet | SLIP-21 node, the owner secret               |
| `evoluSignRegistrationRequest` | Device not registered at Quota Manager | per device | Signature, certificate chain, rotation index |

After the first activation, keys are cached and the device is not needed for syncing or for allocating quota to further wallets.

## Encryption of keys

Two values are encrypted at rest by the platform encryption service (`@suite-common/platform-encryption`, backed by the operating system's secure storage):

- the **Delegated Identity Key**, in `persistentDeviceData[].delegatedIdentityKey`
- the serialized **Suite Sync Owner** (`ownerId` and `ownerSecret`), in `suiteSync.suiteSyncOwners[staticSessionId]`

Both are kept in Redux only as encrypted hex and persisted from there. The derived Evolu keys and the delegated public key are never stored; they are recomputed when needed.

Decryption happens on the fly: whenever keys are needed (step 1), Suite reads the ciphertext from Redux and decrypts it. The plaintext is passed to the code that needs it and is not written back to Redux. If encryption is unavailable or decryption fails, the stored value is deleted, and the key is fetched from the device again next time.

Unencrypted data:

- Suite Sync settings (enabled flag, relay URL) and connection status
- the label mirror in Redux (`suiteSyncData`) and Evolu's local database

Data sent to the relay is always end-to-end encrypted by Evolu.

## Turning off

Turning Suite Sync off for a wallet (`createTurnOffSuiteSyncForWallet`) disposes the subscription, deletes the local storage and removes the stored owner. On web and desktop, forgetting a wallet also removes its stored owner.
