# @trezor/wabisabi-crypto

TypeScript port of the WabiSabi client credential crypto.

This replaces the credential endpoints (`get-zero-credential-requests`,
`get-real-credential-requests`, `get-credentials`) of the
`WalletWasabi.WabiSabiClientLibrary` binary that Suite used to bundle per platform and
drive over localhost HTTP. Everything here is pure local computation; nothing talks to
the network.

## Upstream revision

Frozen at the revision the binary was pinned to. `get-version` disappeared with the
binary, so the pin lives in [`src/upstream.ts`](./src/upstream.ts):

- [`trezor/WalletWasabi`](https://github.com/trezor/WalletWasabi) branch `release/v15.0`,
  commit `34a0f983`
- `NWabiSabi` submodule commit `4716ab08e840c13af35479320241ce82bc548de9`

A coordinator upgrade that changes the crypto means re-syncing both trees by hand.

## Layout

| File                                                                   | Upstream                                                                                                                                                                  |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/strobe.ts`                                                        | `NWabiSabi/WabiSabi/Crypto/StrobeProtocol/{Strobe,StrobeFlags,StrobeHasher}.cs`                                                                                           |
| `src/scalar.ts`                                                        | `NBitcoin.Secp256k1.Scalar` (the parts used), `Crypto/Extensions.cs`                                                                                                      |
| `src/groupElement.ts`                                                  | `Crypto/Groups/{GroupElement,GroupElementVector}.cs`, `ScalarVector.cs`                                                                                                   |
| `src/generators.ts`                                                    | `Crypto/Groups/Generators.cs`                                                                                                                                             |
| `src/transcript.ts`                                                    | `Crypto/ZeroKnowledge/{Transcript,SyntheticSecretNonceProvider}.cs`                                                                                                       |
| `src/linearRelation.ts`                                                | `Crypto/ZeroKnowledge/{Proof}.cs`, `ZeroKnowledge/LinearRelation/*`                                                                                                       |
| `src/proofSystem.ts`                                                   | `Crypto/ZeroKnowledge/ProofSystem.cs`                                                                                                                                     |
| `src/mac.ts`, `src/credential.ts`, `src/credentialIssuerParameters.ts` | `Crypto/Mac.cs`, `Crypto/ZeroKnowledge/{Credential,CredentialPresentation}.cs`, `IssuanceRequest.cs`, `IssuanceValidationData.cs`, `Crypto/CredentialIssuerParameters.cs` |
| `src/credentialRequesting.ts`                                          | `CredentialRequesting/*`                                                                                                                                                  |
| `src/wabiSabiClient.ts`                                                | `WabiSabiClient.cs`                                                                                                                                                       |
| `src/random.ts`                                                        | `Crypto/Randomness/{WasabiRandom,SecureRandom}.cs`                                                                                                                        |
| `src/serialization.ts`                                                 | the wire format the coordinator sees                                                                                                                                      |
| `src/testing/`                                                         | `CredentialIssuer.cs`, `CredentialIssuerSecretKey.cs`, `WabiSabiClientLibrary/Crypto/DeterministicRandom.cs`                                                              |

## `src/testing` is not part of the package API

`src/index.ts` does not re-export it. It holds the coordinator-side issuer and a port of
.NET's legacy seeded `System.Random`. The deterministic PRNG exists only so that
upstream's committed test vectors can be reproduced; reaching it from a credential path
would be a privacy bug. `Math.random` and `@trezor/utils`' `getWeakRandomNumberInRange`
must never appear in this package.

## Parity

- `src/__fixtures__/get{Zero,Real}CredentialRequests.json` and `getCredentials.json` are
  the committed upstream integration-test vectors, asserted byte for byte under the
  deterministic PRNG. The shipped release binary uses a CSPRNG and cannot reproduce
  them, so they are the only reference for the randomness-consuming endpoints.
- `src/__fixtures__/strobeTestVectors.json` is the StrobeGo vector set upstream uses.
- The ten generators are derived at import by upstream's iterated-SHA256 lift and
  asserted against the constants in `WabiSabi.Tests/Crypto/GroupElements/GeneratorTests.cs`,
  so a transcription error cannot survive.
- Serialization parity is a separate requirement from computation parity: the coordinator
  sees PascalCase keys, compressed SEC1 points as UPPERCASE hex and scalars as 32-byte
  UPPERCASE hex. A correct proof serialized differently is a rejected registration.

## Notes for review

- **Variable-time multiplication.** `multiScalarMultiply` and `GroupElement.multiplyUnsafe`
  are variable time, matching upstream: `ECMultContext.MultBatch` is libsecp256k1's
  `ecmult_multi` and `Scalar * GE` is `ecmult`, neither constant time.
  `GroupElement.multiply` and `constantTimeMultiScalarMultiply` are the constant-time
  counterparts; the former carries the single-point multiplications outside proof
  construction.
- **`SyntheticSecretNonceProvider.getScalarVector` discards its first draw.** Upstream's
  `new ScalarVector(Sequence().Take(n))` runs `Guard.NotNullOrEmpty`, whose `.Any()`
  pulls one scalar out of a lazy, side-effecting PRF sequence and throws it away before
  `.ToArray()` re-enumerates. Without that discarded draw none of the vectors reproduce.
- **Performance.** A width-42 credential request (two 42-bit range proofs, two
  presentations, one balance proof) costs about 280 ms warm in Node on this machine; a
  width-8 vsize request about 70 ms. See the parent issue's notes: a pure-JS secp256k1
  cannot match the native binary's wall clock, so callers must keep explicit yield points
  between independent requests.
