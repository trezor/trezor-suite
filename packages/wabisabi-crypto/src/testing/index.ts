/**
 * Test-only entry point: `@trezor/wabisabi-crypto/src/testing`.
 *
 * Deliberately NOT re-exported from `src/index.ts`. The deterministic PRNG here would
 * be a privacy bug in a credential, decomposition or selection path, and the issuer
 * secret key has no business existing in a client.
 */
export {
    CredentialIssuer,
    computeMac,
    computeZ,
    issuerParametersKnowledge,
} from './credentialIssuer';
export { CredentialIssuerSecretKey } from './credentialIssuerSecretKey';
export { DeterministicRandom } from './deterministicRandom';
export { constantRandom, scriptedRandom } from './testRandom';
