import {
    Credential,
    type CredentialPresentation,
    IssuanceRequest,
    IssuanceValidationData,
} from './credential';
import { type CredentialIssuerParameters } from './credentialIssuerParameters';
import {
    type CredentialsResponse,
    CredentialsResponseValidation,
    RealCredentialsRequest,
    type RealCredentialsRequestData,
    ZeroCredentialsRequest,
    type ZeroCredentialsRequestData,
} from './credentialRequesting';
import { WabiSabiCryptoError, WabiSabiCryptoErrorCode } from './errors';
import * as Generators from './generators';
import { type Knowledge, type Proof } from './linearRelation';
import {
    balanceProofKnowledge,
    issuerParametersStatement,
    pedersenCommitment,
    prove,
    proveWithYields,
    rangeProofKnowledge,
    showCredentialKnowledge,
    verify,
    zeroProofKnowledge,
} from './proofSystem';
import { CREDENTIAL_NUMBER } from './protocolConstants';
import { type Random } from './random';
import { type Scalar, scalarAdd, scalarFromNumber, scalarNegate, scalarSum } from './scalar';
import { Transcript } from './transcript';

const textEncoder = new TextEncoder();

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);

/**
 * `WabiSabiClient.BuildTranscript` / `CredentialIssuer.BuildTranscript`.
 *
 * Both sides must label the transcript identically or no proof verifies, so the label
 * lives in one place.
 */
export const buildTranscript = (isNullRequest: boolean) =>
    new Transcript(
        textEncoder.encode(
            `UnifiedRegistration/${CREDENTIAL_NUMBER}/${isNullRequest ? 'True' : 'False'}`,
        ),
    );

/**
 * Port of `NWabiSabi/WabiSabi/WabiSabiClient.cs`.
 *
 * Creates unified WabiSabi credential registration request messages and handles the
 * registration responses received from the coordinator.
 */
export class WabiSabiClient {
    readonly rangeProofWidth: number;
    readonly numberOfCredentials = CREDENTIAL_NUMBER;

    private readonly credentialIssuerParameters: CredentialIssuerParameters;
    private readonly random: Random;

    constructor(
        credentialIssuerParameters: CredentialIssuerParameters,
        random: Random,
        rangeProofUpperBound: number,
    ) {
        this.rangeProofWidth = Math.ceil(Math.log2(rangeProofUpperBound));
        this.random = random;
        this.credentialIssuerParameters = credentialIssuerParameters;
    }

    /**
     * Creates the request for `k` zero-value credentials.
     *
     * These are called null requests. The first registration request message sent to
     * the coordinator is a null request, so that the coordinator issues `k` zero-value
     * credentials that can be used in the following requests.
     */
    createRequestForZeroAmount(): ZeroCredentialsRequestData {
        const credentialsToRequest: IssuanceRequest[] = [];
        const knowledge: Knowledge[] = [];
        const validationData: IssuanceValidationData[] = [];

        for (let i = 0; i < this.numberOfCredentials; i++) {
            const randomness = this.random.getScalar();
            const ma = Generators.Gh.multiply(randomness);

            knowledge.push(zeroProofKnowledge(ma, randomness));
            credentialsToRequest.push(new IssuanceRequest(ma, []));
            validationData.push(new IssuanceValidationData(0, randomness, ma));
        }

        const transcript = buildTranscript(true);

        return {
            credentialsRequest: new ZeroCredentialsRequest(
                credentialsToRequest,
                prove(transcript, knowledge, this.random),
            ),
            credentialsResponseValidation: new CredentialsResponseValidation(
                transcript,
                [],
                validationData,
            ),
        };
    }

    /**
     * Creates the request for `k` credentials.
     *
     * `amountsToRequest` is padded with zeroes so that the same number of credentials
     * is always requested. Passing no amounts at all is the presentation-only overload.
     */
    createRequest(
        amountsToRequest: readonly number[],
        credentialsToPresent: readonly Credential[],
    ): RealCredentialsRequestData {
        const { transcript, knowledge, build } = this.prepareRequest(
            amountsToRequest,
            credentialsToPresent,
        );

        return build(prove(transcript, knowledge, this.random));
    }

    /**
     * `createRequest`, handing the event loop back between the proofs it is made of.
     *
     * A mainnet amount request is a few thousand secp256k1 multiplications and takes a
     * couple of hundred milliseconds; in the desktop build it now runs on the Electron
     * main process event loop, which also serves device IPC. The proofs are identical to
     * `createRequest`'s — same steps, same order, same randomness — so a caller that can
     * await should prefer this one. See `proveWithYields`.
     */
    async createRequestWithYields(
        amountsToRequest: readonly number[],
        credentialsToPresent: readonly Credential[],
        yieldToCaller: () => Promise<void>,
    ): Promise<RealCredentialsRequestData> {
        const { transcript, knowledge, build } = this.prepareRequest(
            amountsToRequest,
            credentialsToPresent,
        );

        return build(await proveWithYields(transcript, knowledge, this.random, yieldToCaller));
    }

    /**
     * Everything a real request needs before the proofs: the presentations, the issuance
     * requests and the witnesses. Shared by the two drivers above.
     */
    private prepareRequest(
        amountsToRequest: readonly number[],
        credentialsToPresent: readonly Credential[],
    ) {
        const credentialAmountsToRequest = [...amountsToRequest];
        if (amountsToRequest.length > 0) {
            const missing = this.numberOfCredentials - amountsToRequest.length;
            for (let i = 0; i < missing; i++) {
                credentialAmountsToRequest.push(0);
            }
        }

        const macsToPresent = credentialsToPresent.map(
            credential => `${credential.mac.t}:${credential.mac.v.toHex()}`,
        );
        if (new Set(macsToPresent).size < macsToPresent.length) {
            throw new WabiSabiCryptoError(WabiSabiCryptoErrorCode.CredentialToPresentDuplicated);
        }

        const zs: Scalar[] = [];
        const knowledgeToProve: Knowledge[] = [];
        const presentations: CredentialPresentation[] = [];
        for (const credential of credentialsToPresent) {
            const z = this.random.getScalar();
            const presentation = credential.present(z);
            presentations.push(presentation);
            knowledgeToProve.push(
                showCredentialKnowledge(
                    presentation,
                    z,
                    credential,
                    this.credentialIssuerParameters,
                ),
            );
            zs.push(z);
        }

        // Generate range proofs (or zero proofs) for each requested credential.
        const credentialsToRequest: IssuanceRequest[] = [];
        const validationData: IssuanceValidationData[] = [];
        for (const value of credentialAmountsToRequest) {
            const scalar = scalarFromNumber(value);

            const randomness = this.random.getScalar();
            const ma = pedersenCommitment(scalar, randomness);

            const { knowledge, bitCommitments } = rangeProofKnowledge(
                scalar,
                randomness,
                this.rangeProofWidth,
                this.random,
            );
            knowledgeToProve.push(knowledge);

            credentialsToRequest.push(new IssuanceRequest(ma, bitCommitments));
            validationData.push(new IssuanceValidationData(value, randomness, ma));
        }

        // Generate the balance proof.
        const sumOfZ = scalarSum(zs);
        const cr = scalarSum(credentialsToPresent.map(credential => credential.randomness));
        const r = scalarSum(validationData.map(data => data.randomness));
        const deltaR = scalarAdd(cr, scalarNegate(r));

        knowledgeToProve.push(balanceProofKnowledge(sumOfZ, deltaR));

        const transcript = buildTranscript(false);
        const delta =
            sum(amountsToRequest) - sum(credentialsToPresent.map(credential => credential.value));

        return {
            transcript,
            knowledge: knowledgeToProve,
            build: (proofs: Proof[]): RealCredentialsRequestData => ({
                credentialsRequest: new RealCredentialsRequest(
                    delta,
                    presentations,
                    credentialsToRequest,
                    proofs,
                ),
                credentialsResponseValidation: new CredentialsResponseValidation(
                    transcript,
                    credentialsToPresent,
                    validationData,
                ),
            }),
        };
    }

    /**
     * Handles the registration response received from the coordinator.
     *
     * Verifies the response message proofs and creates the credentials from the issued
     * MACs. A response whose proofs do not verify under our own transcript means the
     * credentials were not issued with the coordinator's advertised key, so this throws
     * rather than returning anything the caller could mistake for a credential.
     */
    handleResponse(
        registrationResponse: CredentialsResponse,
        registrationValidationData: CredentialsResponseValidation,
    ): Credential[] {
        const issuedCredentialCount = registrationResponse.issuedCredentials.length;
        const requestedCredentialCount = registrationValidationData.requested.length;
        if (issuedCredentialCount !== this.numberOfCredentials) {
            throw new WabiSabiCryptoError(
                WabiSabiCryptoErrorCode.IssuedCredentialNumberMismatch,
                `${issuedCredentialCount} issued but ${requestedCredentialCount} were requested.`,
            );
        }

        const credentials = registrationValidationData.requested.map((requested, index) => ({
            requested,
            issued: registrationResponse.issuedCredentials[index],
        }));

        const statements = credentials.map(({ requested, issued }) => {
            if (issued === undefined) {
                throw new WabiSabiCryptoError(
                    WabiSabiCryptoErrorCode.IssuedCredentialNumberMismatch,
                );
            }

            return issuerParametersStatement(this.credentialIssuerParameters, issued, requested.ma);
        });

        const areCorrectlyIssued = verify(
            registrationValidationData.transcript,
            statements,
            registrationResponse.proofs,
        );
        if (!areCorrectlyIssued) {
            throw new WabiSabiCryptoError(WabiSabiCryptoErrorCode.ClientReceivedInvalidProofs);
        }

        return credentials.map(
            ({ requested, issued }) =>
                new Credential(requested.value, requested.randomness, issued!),
        );
    }
}
