# Refer a Friend: technical background

This document is a technical explanation of the `@suite-common/refer-a-friend` package:
the implementation of how Suite gets a referral identity from the device, and how it authenticates requests to the Refer a Friend API.

## Glossary

- Refer a Friend: the feature as a whole, (e.g. generic Refer a Friend program data).
- Referral – data scoped to the specific wallet seed (e.g. referral account)

## Cryptographic scheme

```
Trezor seed (always standard wallet session = empty passphrase)
  └─ SLIP-10 node at m/10015'/0'
       └─ cipherKeyValue("Join Refer a Friend?", fixed 32-byte value)   ← on the device
            └─ 32-byte ciphertext C
                 └─ seed = SHA-256("trezor-referral-v1" ‖ C)            ← in Suite
                      ├─ ReferralKey = "referral-v1:" + hex(seed)        (secret private key, in Suite it is encrypted at rest)
                      └─ Ed25519 public key = pubkey(seed)               (the account identity)
                           └─ signs every account request (Authorization header)
```

### Essential source code files:

- [referralKey.ts](./src/referralKey.ts) key derivation, the public key, signing
- [referralKeyConstants.ts](./src/referralKeyConstants.ts) the device call parameters
- [getReferralAuthorizationHeader.ts](./src/getReferralAuthorizationHeader.ts) the signed message and the HTTP header
- [key/createRetrieveReferralKeyFromDevice.ts](./src/key/createRetrieveReferralKeyFromDevice.ts) the Connect call

## 1. Device call: `cipherKeyValue`

This is very analogical to legacy labelling:
Suite calls `TrezorConnect.cipherKeyValue` just with different parameters (`REFERRAL_KEY_CIPHER_PARAMS` in `referralKeyConstants.ts`):

| Parameter      | Value                                                              | Why                                                                                                                                                   |
| -------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `path`         | `m/10015'/0'`                                                      | SLIP-0011 path same as legacy labeling.                                                                                                               |
| `key`          | `Join Refer a Friend?`                                             | Shown on the device as the confirmation text. It is also an input of the key derivation so it never overlaps with legacy labelling.                   |
| `value`        | `fc68e5e516b5eb2f5c4a1601c2802626872b9170ceb6b1ca5b1f7c5364838a35` | Fixed 32-byte plaintext, pseudorandomly generated during development; it only has to stay fixed (again, so it never overlaps with legacy labelling.). |
| `encrypt`      | `true`                                                             | Encrypt the value.                                                                                                                                    |
| `askOnEncrypt` | `true`                                                             | The user confirms on the device. Joining needs a physical confirmation.                                                                               |
| `askOnDecrypt` | `true`                                                             | Not used for decryption, but it is part of the derivation input.                                                                                      |

The call also passes the device identity with `useEmptyPassphrase: true` and the standard wallet's `state`.
It is a product specification that the enrollment in Refer a Friend is seed-scoped to the device, not wallet scope, so all passphrase wallets shared the same state.
If there is no standard wallet session available, refer a friend is disabled until it becomes available.

## 2. Key derivation in Suite (`getReferralKeyFromCipheredValue`)

```
seed       = SHA-256(utf8("trezor-referral-v1") ‖ C)        // 32 bytes
ReferralKey = "referral-v1:" + hex(seed)                    // 64 hex characters
```

### Reasoning & TBD

- Do we need the **domain separation** of hashing the raw `cipherKeyValue` with prefix `trezor-referral-v1`? It means that the raw `cipherKeyValue`
  output is never used directly, because:
    - Legacy labelling does it the same, but that's not a good reason.
    - Cryptographic scheme versioning – if we decide to change the curves, we bump the version.
    - Now, the resulting seed is the Ed25519 private key.
- **Storage labelling prefix:** `referral-v1:` we _do_ need that. It does not enter cryptographic operations, it only acts to label the private key _for storage_ → in [Suite Desktop main process](../../suite-app/desktop-app-main/src/modules/safeStorageValidation.ts), the encryption/decryption provider can tell this secret apart from other secrets stored there.
    - For context, Suite Desktop Main process must not facilitate access to arbitary payload encryption/decryption process to the Renderer process. That's why it has an allowlist. This prefix is for that purpose – so that it is clearly identified as such, and an unrelated value cannot be decrypted under the assumption that it is a referral key.

**Public key:**

```
publicKey = hex(Ed25519.getPublicKey(seed))                  // 32 bytes, 64 hex characters
```

The public key is the account identity. The backend knows the account only by this key, so no device id, xpub or address is ever sent.
It is deterministic too, so a re-derived key opens the same account (e.g. when you recover your wallet backup on a different physical device).

**Storage.** `ReferralKey` is a secret.

- It is stored only encrypted with `PlatformEncryption` (desktop safeStorage/keyring, mobile secure storage).
- When encryption is unavailable (web, Linux without a keyring), it is kept in memory for the session only.
- Only derived, non-secret data go to the persisted Redux state in plain text.

## 3. Signing requests (`getReferralAuthorizationHeader`)

Every account endpoint (`v1/account`, `v1/account/leave`, `v1/vouchers`) is signed.
`v1/program` is public and unsigned.

**Signed message.** A newline-joined UTF-8 string:

```
v1
<METHOD>                 GET | POST
<PATH>                   URL path without host and query, e.g. /v1/account
<TIMESTAMP>              Unix time in seconds
<hex(SHA-256(body))>     body is "{}" for POST and "" for GET
```

**Signature:**

```
sig = hex(Ed25519.sign(utf8(message), seed))                 // 64 bytes, 128 hex characters
```

**Header:**

```
Authorization: Referral v1; pubkey="<64 hex>"; ts="<seconds>"; sig="<128 hex>"
```

**Why each part is there:**

- **`v1` first.** Versions the message format. A signature from a future format can't be replayed as v1.
- **Method and path.** Bind the signature to one endpoint. A signed `GET /v1/vouchers` can't be replayed as `POST /v1/account/leave`.
- **Timestamp.** Limits replay. The server rejects a timestamp more than 300 seconds from its own clock (error `timestampExpired`). The mock server checks the same window.
- **Body hash.** Binds the exact body bytes without putting the body into the message. It is hashed even when empty, so the format is the same for every request.
- **Header, not URL.** The public key and signature never go in the URL, so they don't end up in access logs or proxies.

**Verification on the server:**

1. Parse the header.
2. Rebuild the message from the received method, path, `ts` and the raw body bytes.
3. Verify the Ed25519 signature against `pubkey`.
4. Check the timestamp window.

`pubkey` then identifies the account.

Ed25519 signatures are deterministic, so signing needs no randomness on the client.

**First registration of a new pubkey**

1. Signed `GET v1/account` is sent to the server, but the pubkey is unknown to the server → it returns `status: 'none'`. If it is `active` (already joined elsewhere), it is only loaded and nothing is created.
2. Signed `POST v1/account`: creates the account for the pubkey (or reactivates a `left` one) and returns `code` and `shareUrl`.
3. Signed `GET v1/vouchers`: loads the vouchers, empty for a new account.

The only proof from the client to the server is the signature, i.e. possession of the private key that signed the message, verified by the public key (trust on first use).

## 4. Summary of trust

- **The wallet on Trezor device is used to obtain the key.** The private key is therefore tied to users' wallet backup (deterministic, retrievable after loss).
  The derivation needs a physical confirmation on the device – requires human consent.
  The backend does not, however, authenticate a physical device. In fact, any generated private key would work for authentication.
- **After that, the key alone authorizes requests.** Anyone holding `ReferralKey` can act on the
  account, which is why it is encrypted at rest or kept in memory only. It only grants access to
  the referral account: it can't spend funds or reveal addresses or xpubs.
- **Leaving the program deletes the stored key.** Rejoining derives it again on the device and
  gets the same public key.
- **Not in v1:** proving that the key comes from a genuine Trezor (secure-element attestation).
  That is the planned v2.

## 5. Roadmap for Refer-a-Friend v2

Out of scope for now, just FYI:

- Device authenticity proof is required by the server, not just any private key – will be verified similarly to the Quota Manager.
- Server must prove its authenticity to Suite (known pub keys baked into Suite, server signs its responses). With current rewards, there are no such needs.
