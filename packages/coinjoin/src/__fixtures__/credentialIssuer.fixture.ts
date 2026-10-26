import {
    type SerializedCredentialsRequest,
    deserializeCredentialsRequest,
    serializeCredentialsResponse,
    serializeIssuerParameters,
} from '@trezor/wabisabi-crypto';
import {
    CredentialIssuer,
    CredentialIssuerSecretKey,
    DeterministicRandom,
} from '@trezor/wabisabi-crypto/src/testing';

import { getCredentials, getRealCredentials, getZeroCredentials } from '../client/credentials';
import { type IssuerParameter } from '../types/coordinator';

/**
 * The mock coordinator's credential issuer key.
 *
 * `mocks/server.ts` answers the credential endpoints with a real `CredentialIssuer`
 * built from this key, which means it validates the balance proof, every range proof and
 * a serial-number set that rejects re-presentation. All four round-phase suites therefore
 * exercise the full credential round trip, and a malformed request fails the test instead
 * of passing through — `connectionConfirmation.test.ts` has a case that proves it. Before
 * this, the mock answered with structurally fake data (`Ma: '00'`, `Proofs: [{}, {}]`) and
 * the suites proved plumbing only.
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

/** One side of the round: which issuer and which upper bound a credential belongs to. */
export interface CredentialKind {
    issuer: CredentialIssuer;
    issuerParameters: IssuerParameter;
    maxCredentialValue: number;
}

/** The issuer's answer to a request, through the wire format as the coordinator's is. */
const answer = (issuer: CredentialIssuer, request: SerializedCredentialsRequest) =>
    serializeCredentialsResponse(issuer.handleRequest(deserializeCredentialsRequest(request)));

/**
 * The zero-value credentials a null request gets, from the mock coordinator's issuer.
 *
 * Real credentials, not placeholders: the issuer checked the request's zero proofs and
 * signed what it issued, and the client verified the issuer-parameters proofs on the way
 * back. A round-phase suite that needs an input to start mid-round has to go through
 * this, because a `Credential` is a value plus a blinding factor plus a MAC only the
 * coordinator can produce.
 */
export const mintZeroCredentials = ({
    issuer,
    issuerParameters,
    maxCredentialValue,
}: CredentialKind) => {
    const request = getZeroCredentials(issuerParameters, maxCredentialValue);

    return getCredentials(
        issuerParameters,
        maxCredentialValue,
        answer(issuer, request.CredentialsRequest),
        request.CredentialsResponseValidation,
    );
};

/**
 * Credentials of the given values, from the mock coordinator's issuer.
 *
 * Null request, then a real request that presents what it got and asks for the values
 * wanted — which is the registration flow, so the issuer validates a balance proof and a
 * range proof per value just as it will for the suite's own requests. The issuer lets the
 * balance grow, as upstream's does: it is the arena, not the issuer, that decides how
 * much a round may issue.
 */
export const mintCredentials = async (kind: CredentialKind, values: [number, number]) => {
    const { issuer, issuerParameters, maxCredentialValue } = kind;
    const request = await getRealCredentials(
        values,
        mintZeroCredentials(kind),
        issuerParameters,
        maxCredentialValue,
    );

    return getCredentials(
        issuerParameters,
        maxCredentialValue,
        answer(issuer, request.CredentialsRequest),
        request.CredentialsResponseValidation,
    );
};

/**
 * A real credential request for the given values, ready to be sent to the mock
 * coordinator — what an input carries as `realAmountCredentials` after registration.
 */
export const mintCredentialsRequest = (kind: CredentialKind, values: [number, number]) =>
    getRealCredentials(
        values,
        mintZeroCredentials(kind),
        kind.issuerParameters,
        kind.maxCredentialValue,
    );
