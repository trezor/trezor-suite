import getCredentials from './__fixtures__/getCredentials.json';
import getRealCredentialRequests from './__fixtures__/getRealCredentialRequests.json';
import getZeroCredentialRequests from './__fixtures__/getZeroCredentialRequests.json';
import { type Credential } from './credential';
import { CredentialsResponseValidation } from './credentialRequesting';
import { WabiSabiCryptoErrorCode } from './errors';
import { Proof } from './linearRelation';
import { Mac } from './mac';
import {
    type SerializedCredentialsRequest,
    deserializeCredential,
    deserializeCredentialPresentation,
    deserializeCredentialsResponse,
    deserializeGroupElement,
    deserializeIssuanceValidationData,
    deserializeIssuerParameters,
    deserializeScalar,
    serializeCredential,
    serializeCredentialPresentation,
    serializeCredentialsRequest,
    serializeGroupElement,
    serializeIssuanceValidationData,
    serializeIssuerParameters,
    serializeScalar,
} from './serialization';
import { DeterministicRandom } from './testing';
import { Transcript } from './transcript';
import { WabiSabiClient } from './wabiSabiClient';

/**
 * Parity tests against the six committed
 * `WalletWasabi.WabiSabiClientLibrary.Tests/IntegrationTests/TestVectors/*.json`
 * files, three of which live here. All of them were generated under
 * `DeterministicRandom(0)`; the shipped release binary uses a CSPRNG and cannot
 * reproduce them, so this is their only reference.
 */

const toBase64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64');
const fromBase64 = (value: string) => new Uint8Array(Buffer.from(value, 'base64'));

const serializeTranscript = (transcript: Transcript) => {
    const dumped = transcript.dumpState();

    return {
        Strobe: {
            State: toBase64(dumped.state),
            Position: dumped.position,
            BeginPosition: dumped.beginPosition,
            CurrentFlags: dumped.currentFlags,
        },
    };
};

type SerializedTranscript = ReturnType<typeof serializeTranscript>;

const deserializeTranscript = (serialized: SerializedTranscript) =>
    Transcript.fromStrobeState({
        state: fromBase64(serialized.Strobe.State),
        position: serialized.Strobe.Position,
        beginPosition: serialized.Strobe.BeginPosition,
        currentFlags: serialized.Strobe.CurrentFlags,
    });

describe('WabiSabiClient — get-zero-credential-requests vectors', () => {
    getZeroCredentialRequests.forEach((vector, index) => {
        it(`vector ${index} matches byte for byte`, () => {
            const { CredentialIssuerParameters, MaxCredentialValue } = vector.Request;
            const client = new WabiSabiClient(
                deserializeIssuerParameters(CredentialIssuerParameters),
                new DeterministicRandom(0),
                MaxCredentialValue,
            );

            const { credentialsRequest, credentialsResponseValidation } =
                client.createRequestForZeroAmount();
            const expected = vector.ExpectedResponse.ZeroCredentialRequests;

            expect(serializeCredentialsRequest(credentialsRequest)).toEqual(
                expected.CredentialsRequest,
            );
            expect({
                Transcript: serializeTranscript(credentialsResponseValidation.transcript),
                Presented: credentialsResponseValidation.presented.map(serializeCredential),
                Requested: credentialsResponseValidation.requested.map(
                    serializeIssuanceValidationData,
                ),
            }).toEqual(expected.CredentialsResponseValidation);
        });
    });
});

describe('WabiSabiClient — get-real-credential-requests vectors', () => {
    getRealCredentialRequests.forEach((vector, index) => {
        it(`vector ${index} matches byte for byte`, () => {
            const {
                AmountsToRequest,
                CredentialIssuerParameters,
                MaxCredentialValue,
                CredentialsToPresent,
            } = vector.Request;
            const client = new WabiSabiClient(
                deserializeIssuerParameters(CredentialIssuerParameters),
                new DeterministicRandom(0),
                MaxCredentialValue,
            );

            const { credentialsRequest, credentialsResponseValidation } = client.createRequest(
                AmountsToRequest,
                CredentialsToPresent.map(deserializeCredential),
            );
            const expected = vector.ExpectedResponse.RealCredentialRequests;

            expect(serializeCredentialsRequest(credentialsRequest)).toEqual(
                expected.CredentialsRequest,
            );
            expect({
                Transcript: serializeTranscript(credentialsResponseValidation.transcript),
                Presented: credentialsResponseValidation.presented.map(serializeCredential),
                Requested: credentialsResponseValidation.requested.map(
                    serializeIssuanceValidationData,
                ),
            }).toEqual(expected.CredentialsResponseValidation);
        });
    });
});

describe('WabiSabiClient — get-credentials vectors', () => {
    const vector = getCredentials[0]!;
    const { CredentialIssuerParameters, CredentialsResponse, CredentialsValidationData } =
        vector.Request;

    const buildClient = () =>
        new WabiSabiClient(
            deserializeIssuerParameters(CredentialIssuerParameters),
            new DeterministicRandom(0),
            // The vector omits `GetCredentialsRequest.MaxAmountCredentialValue`, so
            // upstream deserializes it as 0 and derives a nonsense range proof width
            // from it. That is harmless there and here: the width is only read when
            // building a request, never when validating a response. Any value does, so
            // this is the mainnet round's.
            4_300_000_000_000,
        );

    const buildValidationData = () =>
        new CredentialsResponseValidation(
            deserializeTranscript(CredentialsValidationData.Transcript),
            CredentialsValidationData.Presented.map(deserializeCredential),
            CredentialsValidationData.Requested.map(deserializeIssuanceValidationData),
        );

    it('matches byte for byte', () => {
        const credentials = buildClient().handleResponse(
            deserializeCredentialsResponse(CredentialsResponse),
            buildValidationData(),
        );

        expect(credentials.map(serializeCredential)).toEqual(vector.ExpectedResponse.Credentials);
    });

    // Upstream ships no negative vector for this, so it is written here: a response the
    // coordinator did not actually produce with its advertised key must not yield a
    // credential the caller could go on to present.
    it('throws when a Proofs entry is tampered with', () => {
        const response = deserializeCredentialsResponse(CredentialsResponse);
        const [firstProof, ...restProofs] = response.proofs;
        const tampered = {
            ...response,
            proofs: [
                new Proof(firstProof!.publicNonces, [
                    (firstProof!.responses[0] as bigint) + 1n,
                    ...firstProof!.responses.slice(1),
                ]),
                ...restProofs,
            ],
        };

        expect(() => buildClient().handleResponse(tampered, buildValidationData())).toThrow(
            WabiSabiCryptoErrorCode[WabiSabiCryptoErrorCode.ClientReceivedInvalidProofs],
        );
    });

    it('throws when a public nonce is tampered with', () => {
        const response = deserializeCredentialsResponse(CredentialsResponse);
        const [firstProof, ...restProofs] = response.proofs;
        const tampered = {
            ...response,
            proofs: [
                new Proof(
                    [firstProof!.publicNonces[0]!.negate(), ...firstProof!.publicNonces.slice(1)],
                    firstProof!.responses,
                ),
                ...restProofs,
            ],
        };

        expect(() => buildClient().handleResponse(tampered, buildValidationData())).toThrow(
            WabiSabiCryptoErrorCode[WabiSabiCryptoErrorCode.ClientReceivedInvalidProofs],
        );
    });

    it('throws when an IssuedCredentials MAC is tampered with', () => {
        const response = deserializeCredentialsResponse(CredentialsResponse);
        const [firstMac, ...restMacs] = response.issuedCredentials;
        const tampered = {
            ...response,
            issuedCredentials: [new Mac(firstMac!.t, firstMac!.v.negate()), ...restMacs],
        };

        expect(() => buildClient().handleResponse(tampered, buildValidationData())).toThrow(
            WabiSabiCryptoErrorCode[WabiSabiCryptoErrorCode.ClientReceivedInvalidProofs],
        );
    });

    it('throws when the wrong number of credentials is issued', () => {
        const response = deserializeCredentialsResponse(CredentialsResponse);
        const tampered = { ...response, issuedCredentials: response.issuedCredentials.slice(1) };

        expect(() => buildClient().handleResponse(tampered, buildValidationData())).toThrow(
            '1 issued but 2 were requested.',
        );
    });
});

describe('WabiSabiClient', () => {
    const issuerParameters = deserializeIssuerParameters(
        getZeroCredentialRequests[0]!.Request.CredentialIssuerParameters,
    );

    it('derives the range proof width from the credential upper bound', () => {
        const width = (upperBound: number) =>
            new WabiSabiClient(issuerParameters, new DeterministicRandom(0), upperBound)
                .rangeProofWidth;

        expect(width(255)).toBe(8);
        // MaxAmountCredentialValue for a mainnet round is 4,300,000,000,000 sats.
        expect(width(4_300_000_000_000)).toBe(42);
        // MaxVsizeAllocationPerAlice is 255 on the coordinator today; a 4,096 bound is 12.
        expect(width(4096)).toBe(12);
    });

    it('rejects presenting the same credential twice', () => {
        const client = new WabiSabiClient(issuerParameters, new DeterministicRandom(0), 255);
        const credential = deserializeCredential(
            getRealCredentialRequests[0]!.Request.CredentialsToPresent[0]!,
        );

        expect(() => client.createRequest([1], [credential, credential])).toThrow(
            WabiSabiCryptoErrorCode[WabiSabiCryptoErrorCode.CredentialToPresentDuplicated],
        );
    });

    it('pads the requested amounts up to the credential number', () => {
        const client = new WabiSabiClient(issuerParameters, new DeterministicRandom(0), 255);
        const { credentialsRequest } = client.createRequest([7], []);

        expect(credentialsRequest.requested).toHaveLength(2);
        expect(credentialsRequest.delta).toBe(7);
    });

    it('does not request credentials for a presentation-only request', () => {
        const client = new WabiSabiClient(issuerParameters, new DeterministicRandom(0), 255);
        const credentials = getRealCredentialRequests[0]!.Request.CredentialsToPresent.map(
            deserializeCredential,
        ) as Credential[];
        const { credentialsRequest } = client.createRequest([], credentials);

        expect(credentialsRequest.requested).toHaveLength(0);
        expect(credentialsRequest.presented).toHaveLength(2);
        expect(credentialsRequest.delta).toBe(0);
    });
});

describe('serialization', () => {
    const request = getRealCredentialRequests[0]!.ExpectedResponse.RealCredentialRequests
        .CredentialsRequest as SerializedCredentialsRequest;

    it('emits uppercase hex for every point and scalar', () => {
        const hexes = [
            ...request.Presented.flatMap(presentation => Object.values(presentation)),
            ...request.Requested.flatMap(issuance => [issuance.Ma, ...issuance.BitCommitments]),
            ...request.Proofs.flatMap(proof => [...proof.PublicNonces, ...proof.Responses]),
        ];

        expect(hexes.length).toBeGreaterThan(0);
        hexes.forEach(hex => expect(hex).toBe(hex.toUpperCase()));
    });

    it('round-trips every point in the vector', () => {
        const points = [
            ...request.Requested.flatMap(issuance => [issuance.Ma, ...issuance.BitCommitments]),
            ...request.Proofs.flatMap(proof => proof.PublicNonces),
        ];

        points.forEach(hex =>
            expect(serializeGroupElement(deserializeGroupElement(hex))).toBe(hex),
        );
    });

    it('round-trips every scalar in the vector', () => {
        request.Proofs.forEach(proof => {
            proof.Responses.forEach(hex =>
                expect(serializeScalar(deserializeScalar(hex))).toBe(hex),
            );
        });
    });

    it('serializes a scalar as 32 bytes with leading zeroes', () => {
        expect(serializeScalar(1n)).toBe(`${'0'.repeat(63)}1`);
    });

    it('rejects a scalar at or above the group order', () => {
        expect(() => deserializeScalar('FF'.repeat(32))).toThrow('Scalar out of range');
    });

    it('round-trips a credential presentation', () => {
        const presentation = deserializeCredentialPresentation(request.Presented[0]!);

        expect(serializeCredentialPresentation(presentation)).toEqual(request.Presented[0]);
    });

    it('round-trips issuer parameters', () => {
        const serialized = getZeroCredentialRequests[0]!.Request.CredentialIssuerParameters;

        expect(serializeIssuerParameters(deserializeIssuerParameters(serialized))).toEqual(
            serialized,
        );
    });
});
