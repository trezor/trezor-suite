/**
 * What a suite puts in place of a credential request when it has stubbed the credential
 * layer, because its subject is somewhere else entirely.
 *
 * Only `src/client/CoinjoinRound.test.ts` does that, to keep a race against fixed
 * timeouts from measuring a few thousand secp256k1 multiplications. Everything else goes
 * through the mock coordinator's issuer, and a malformed request fails there rather than
 * being waved through — the marker is explicit so that a real request can never be
 * mistaken for a stubbed one. `server.ts` reads it; it lives in its own module because
 * `server.ts` cannot be imported from inside a `jest.mock` factory for `../credentials`,
 * which `server.ts` transitively needs.
 */
export const STUBBED_CREDENTIALS_REQUEST = {
    Delta: 0,
    Presented: [],
    Requested: [],
    Proofs: [],
    StubbedByTest: true,
} as const;
