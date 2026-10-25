import { serializeIssuerParameters } from '@trezor/wabisabi-crypto';
import {
    CredentialIssuer,
    CredentialIssuerSecretKey,
    DeterministicRandom,
} from '@trezor/wabisabi-crypto/src/testing';

/**
 * The mock coordinator's credential issuer key.
 *
 * `mocks/server.ts` answers the credential endpoints with a real `CredentialIssuer`
 * built from this key, which means it validates the balance proof, every range proof and
 * a serial-number set that rejects re-presentation. The round-phase suites therefore
 * exercise the full credential round trip, and a malformed request fails the test instead
 * of passing through. Before this, the mock answered with structurally fake data
 * (`Ma: '00'`, `Proofs: [{}, {}]`) and the suites proved plumbing only.
 *
 * The key is derived from a fixed seed so that the issuer parameters in
 * `round.fixture.ts` — which the client must be given in order to build a request the
 * issuer will accept — are stable.
 */
const MOCK_ISSUER_SEED = 1;

const secretKeyRandom = new DeterministicRandom(MOCK_ISSUER_SEED);

/** The amount credential issuer's secret key. */
export const AMOUNT_ISSUER_SECRET_KEY = CredentialIssuerSecretKey.fromRandom(secretKeyRandom);

/** The vsize credential issuer's secret key. */
export const VSIZE_ISSUER_SECRET_KEY = CredentialIssuerSecretKey.fromRandom(secretKeyRandom);

/**
 * The issuer parameters the coordinator advertises, derived from the keys above.
 *
 * These must agree with the round parameters: the client sizes its range proofs from
 * `MaxAmountCredentialValue` and `MaxVsizeAllocationPerAlice`, and the issuer checks the
 * bit width it gets against the same numbers.
 */
export const AMOUNT_CREDENTIAL_ISSUER_PARAMETERS = serializeIssuerParameters(
    AMOUNT_ISSUER_SECRET_KEY.computeCredentialIssuerParameters(),
);

export const VSIZE_CREDENTIAL_ISSUER_PARAMETERS = serializeIssuerParameters(
    VSIZE_ISSUER_SECRET_KEY.computeCredentialIssuerParameters(),
);

/**
 * A per-round pair of issuers.
 *
 * `CredentialIssuer` is stateful — it tracks presented serial numbers and the issued
 * balance — so the coordinator needs one instance per round, as upstream does.
 */
export const createRoundIssuers = (
    maxAmountCredentialValue: number,
    maxVsizeAllocationPerAlice: number,
) => {
    // The issuance nonces do not have to be unpredictable for a mock, and a seeded
    // generator keeps a failing round-phase test reproducible.
    const random = new DeterministicRandom(MOCK_ISSUER_SEED + 1);

    return {
        amount: new CredentialIssuer(AMOUNT_ISSUER_SECRET_KEY, random, maxAmountCredentialValue),
        vsize: new CredentialIssuer(VSIZE_ISSUER_SECRET_KEY, random, maxVsizeAllocationPerAlice),
    };
};
