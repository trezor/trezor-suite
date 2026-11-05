import { Credential } from '../credential';
import {
    RealCredentialsRequest,
    areThereDuplicatedSerialNumbers,
    isNullRequest,
    isPresentationOnlyRequest,
    serialNumbers,
} from '../credentialRequesting';
import { WabiSabiCryptoErrorCode } from '../errors';
import * as Generators from '../generators';
import { Proof } from '../linearRelation';
import { secureRandom } from '../random';
import { SCALAR_ONE, scalarAdd } from '../scalar';
import { WabiSabiClient } from '../wabiSabiClient';
import { CredentialIssuer } from './credentialIssuer';
import { CredentialIssuerSecretKey } from './credentialIssuerSecretKey';
import { DeterministicRandom } from './deterministicRandom';

/**
 * The client and the issuer exercised against each other.
 *
 * This is what makes the mock coordinator in `@trezor/coinjoin` meaningful: the issuer
 * validates the balance proof, every range proof and the serial-number set, so a
 * malformed request fails instead of passing through.
 *
 * Upstream's `ZeroCredentialsRequestTests` / `RealCredentialsRequestTests` only assert
 * C# record equality of the request objects, which has no counterpart here, so they are
 * not ported.
 */

const MAX_AMOUNT = 4_300_000_000_000;

const setUp = (maxAmount = MAX_AMOUNT) => {
    const sk = CredentialIssuerSecretKey.fromRandom(secureRandom);
    const issuer = new CredentialIssuer(sk, secureRandom, maxAmount);
    const client = new WabiSabiClient(
        sk.computeCredentialIssuerParameters(),
        secureRandom,
        maxAmount,
    );

    return { sk, issuer, client };
};

/** One null request, i.e. what a client does before it can present anything. */
const getZeroCredentials = (client: WabiSabiClient, issuer: CredentialIssuer) => {
    const { credentialsRequest, credentialsResponseValidation } =
        client.createRequestForZeroAmount();
    const response = issuer.handleRequest(credentialsRequest);

    return client.handleResponse(response, credentialsResponseValidation);
};

describe('CredentialIssuer', () => {
    it('issues zero-value credentials for a null request', () => {
        const { client, issuer } = setUp();
        const credentials = getZeroCredentials(client, issuer);

        expect(credentials).toHaveLength(2);
        credentials.forEach(credential => {
            expect(credential).toBeInstanceOf(Credential);
            expect(credential.value).toBe(0);
        });
        expect(issuer.balance).toBe(0);
    });

    it('issues real credentials and tracks the balance across a full round trip', () => {
        const { client, issuer } = setUp();
        const zeroCredentials = getZeroCredentials(client, issuer);

        // Input registration: request 1_000_000 against zero-value credentials.
        const registration = client.createRequest([1_000_000], zeroCredentials);
        expect(registration.credentialsRequest.delta).toBe(1_000_000);
        const issued = client.handleResponse(
            issuer.handleRequest(registration.credentialsRequest),
            registration.credentialsResponseValidation,
        );
        expect(issued.map(credential => credential.value)).toEqual([1_000_000, 0]);
        expect(issuer.balance).toBe(1_000_000);

        // Output registration: present them and request less, so delta is negative.
        const reissuance = client.createRequest([400_000, 500_000], issued);
        expect(reissuance.credentialsRequest.delta).toBe(-100_000);
        const reissued = client.handleResponse(
            issuer.handleRequest(reissuance.credentialsRequest),
            reissuance.credentialsResponseValidation,
        );
        expect(reissued.map(credential => credential.value)).toEqual([400_000, 500_000]);
        expect(issuer.balance).toBe(900_000);
    });

    it('rejects re-presenting a credential', () => {
        const { client, issuer } = setUp();
        const zeroCredentials = getZeroCredentials(client, issuer);

        const first = client.createRequest([10], zeroCredentials);
        issuer.handleRequest(first.credentialsRequest);

        const second = client.createRequest([10], zeroCredentials);
        expect(() => issuer.handleRequest(second.credentialsRequest)).toThrow(
            'Serial number reused',
        );
    });

    it('rejects a request with a tampered balance proof', () => {
        const { client, issuer } = setUp();
        const zeroCredentials = getZeroCredentials(client, issuer);
        const { credentialsRequest } = client.createRequest([10], zeroCredentials);

        // The balance proof is the last one in the compound proof.
        const proofs = [...credentialsRequest.proofs];
        const last = proofs[proofs.length - 1] as Proof;
        proofs[proofs.length - 1] = new Proof(last.publicNonces, [
            scalarAdd(last.responses[0]!, SCALAR_ONE),
            ...last.responses.slice(1),
        ]);

        expect(() =>
            issuer.handleRequest(
                new RealCredentialsRequest(
                    credentialsRequest.delta,
                    credentialsRequest.presented,
                    credentialsRequest.requested,
                    proofs,
                ),
            ),
        ).toThrow(
            WabiSabiCryptoErrorCode[WabiSabiCryptoErrorCode.CoordinatorReceivedInvalidProofs],
        );
    });

    it('rejects a request whose claimed delta does not match the amounts', () => {
        const { client, issuer } = setUp();
        const zeroCredentials = getZeroCredentials(client, issuer);
        const { credentialsRequest } = client.createRequest([10], zeroCredentials);

        expect(() =>
            issuer.handleRequest(
                new RealCredentialsRequest(
                    credentialsRequest.delta + 1,
                    credentialsRequest.presented,
                    credentialsRequest.requested,
                    credentialsRequest.proofs,
                ),
            ),
        ).toThrow(
            WabiSabiCryptoErrorCode[WabiSabiCryptoErrorCode.CoordinatorReceivedInvalidProofs],
        );
    });

    it('frees the serial numbers of a rejected request so they can be retried', () => {
        const { client, issuer } = setUp();
        const zeroCredentials = getZeroCredentials(client, issuer);
        const { credentialsRequest, credentialsResponseValidation } = client.createRequest(
            [10],
            zeroCredentials,
        );

        expect(() =>
            issuer.handleRequest(
                new RealCredentialsRequest(
                    credentialsRequest.delta + 1,
                    credentialsRequest.presented,
                    credentialsRequest.requested,
                    credentialsRequest.proofs,
                ),
            ),
        ).toThrow();

        // The same serial numbers must still be accepted, since the rejected request
        // never actually spent them.
        expect(() =>
            client.handleResponse(
                issuer.handleRequest(credentialsRequest),
                credentialsResponseValidation,
            ),
        ).not.toThrow();
    });

    it('rejects duplicated serial numbers within one request', () => {
        const { client, issuer } = setUp();
        const zeroCredentials = getZeroCredentials(client, issuer);
        const { credentialsRequest } = client.createRequest([10], zeroCredentials);
        const [presentation] = credentialsRequest.presented;

        expect(() =>
            issuer.handleRequest(
                new RealCredentialsRequest(
                    credentialsRequest.delta,
                    [presentation!, presentation!],
                    credentialsRequest.requested,
                    credentialsRequest.proofs,
                ),
            ),
        ).toThrow(WabiSabiCryptoErrorCode[WabiSabiCryptoErrorCode.SerialNumberDuplicated]);
    });

    it('rejects the wrong number of presented credentials', () => {
        const { client, issuer } = setUp();
        const zeroCredentials = getZeroCredentials(client, issuer);
        const { credentialsRequest } = client.createRequest([10], zeroCredentials);

        expect(() =>
            issuer.handleRequest(
                new RealCredentialsRequest(
                    credentialsRequest.delta,
                    credentialsRequest.presented.slice(1),
                    credentialsRequest.requested,
                    credentialsRequest.proofs,
                ),
            ),
        ).toThrow('2 credential presentations were expected but 1 were received.');
    });

    it('rejects the wrong number of requested credentials', () => {
        const { client, issuer } = setUp();
        const zeroCredentials = getZeroCredentials(client, issuer);
        const { credentialsRequest } = client.createRequest([10], zeroCredentials);

        expect(() =>
            issuer.handleRequest(
                new RealCredentialsRequest(
                    credentialsRequest.delta,
                    credentialsRequest.presented,
                    credentialsRequest.requested.slice(1),
                    credentialsRequest.proofs,
                ),
            ),
        ).toThrow('2 credential requests were expected but 1 were received.');
    });

    it('rejects range proofs of the wrong bit width', () => {
        const sk = CredentialIssuerSecretKey.fromRandom(secureRandom);
        const issuer = new CredentialIssuer(sk, secureRandom, MAX_AMOUNT);
        // A client whose idea of the credential upper bound disagrees with the issuer's
        // produces range proofs of the wrong width.
        const client = new WabiSabiClient(
            sk.computeCredentialIssuerParameters(),
            secureRandom,
            255,
        );
        const zeroCredentials = getZeroCredentials(client, issuer);
        const { credentialsRequest } = client.createRequest([10], zeroCredentials);

        expect(() => issuer.handleRequest(credentialsRequest)).toThrow(
            WabiSabiCryptoErrorCode[WabiSabiCryptoErrorCode.InvalidBitCommitment],
        );
    });

    it('refuses to let the balance go negative', () => {
        const { client, issuer } = setUp();
        const zeroCredentials = getZeroCredentials(client, issuer);
        const { credentialsRequest } = client.createRequest([], zeroCredentials);

        expect(isPresentationOnlyRequest(credentialsRequest)).toBe(false);
        expect(() =>
            issuer.handleRequest(
                new RealCredentialsRequest(
                    -1,
                    credentialsRequest.presented,
                    [],
                    credentialsRequest.proofs,
                ),
            ),
        ).toThrow('Negative issuer balance');
    });

    it('exposes the derived issuer parameters and range proof width', () => {
        const { sk, issuer } = setUp();

        expect(issuer.rangeProofWidth).toBe(42);
        expect(issuer.maxAmount).toBe(MAX_AMOUNT);
        expect(issuer.issuerParameters.Cw.toHex()).toBe(
            sk.computeCredentialIssuerParameters().Cw.toHex(),
        );
    });

    it('classifies requests', () => {
        const { client, issuer } = setUp();
        const zeroCredentials = getZeroCredentials(client, issuer);
        const zero = client.createRequestForZeroAmount().credentialsRequest;
        const real = client.createRequest([10], zeroCredentials).credentialsRequest;

        expect(isNullRequest(zero)).toBe(true);
        expect(isNullRequest(real)).toBe(false);
        expect(serialNumbers(zero)).toHaveLength(0);
        expect(serialNumbers(real)).toHaveLength(2);
        expect(areThereDuplicatedSerialNumbers(real)).toBe(false);
    });
});

describe('DeterministicRandom', () => {
    // Verified against the committed upstream vectors: the first two 32-byte draws of
    // `new Random(0)` are the two `Randomness` values in GetZeroCredentialRequests.json.
    it('reproduces .NET new Random(0)', () => {
        const random = new DeterministicRandom(0);

        expect(Buffer.from(random.getBytes(32)).toString('hex').toUpperCase()).toBe(
            '1A0C466F5D75E4D8AD6765D5F519DBC82B7C343B37F88500EC5E64005393B30D',
        );
        expect(Buffer.from(random.getBytes(32)).toString('hex').toUpperCase()).toBe(
            '4A402975CF746C0FF4BEC24D1E04EB4BB598FEA846B56A21864682FE10E4841A',
        );
    });

    it('is reproducible and seed dependent', () => {
        expect(new DeterministicRandom(0).getBytes(16)).toEqual(
            new DeterministicRandom(0).getBytes(16),
        );
        expect(new DeterministicRandom(0).getBytes(16)).not.toEqual(
            new DeterministicRandom(1).getBytes(16),
        );
    });

    it('draws integers in the requested half-open range', () => {
        const random = new DeterministicRandom(0);
        for (let i = 0; i < 2_000; i++) {
            const value = random.getInt(5, 9);
            expect(value).toBeGreaterThanOrEqual(5);
            expect(value).toBeLessThan(9);
        }
    });

    it('handles the large-range path of .NET Random.Next', () => {
        const random = new DeterministicRandom(0);
        for (let i = 0; i < 200; i++) {
            const value = random.getInt(-2_000_000_000, 2_000_000_000);
            expect(value).toBeGreaterThanOrEqual(-2_000_000_000);
            expect(value).toBeLessThan(2_000_000_000);
        }
    });

    it('produces non-zero, in-range scalars', () => {
        const random = new DeterministicRandom(0);
        for (let i = 0; i < 50; i++) {
            const scalar = random.getScalar();
            expect(scalar).toBeGreaterThan(0n);
        }
        expect(Generators.G.multiply(new DeterministicRandom(7).getScalar()).isInfinity).toBe(
            false,
        );
    });
});
