import { type CredentialPresentation, type IssuanceRequest } from '../credential';
import { type CredentialIssuerParameters } from '../credentialIssuerParameters';
import {
    type CredentialsRequest,
    type CredentialsResponse,
    areThereDuplicatedSerialNumbers,
    isNullRequest as isNullRequestOf,
    isPresentationOnlyRequest,
    serialNumbers as serialNumbersOf,
} from '../credentialRequesting';
import { WabiSabiCryptoError, WabiSabiCryptoErrorCode } from '../errors';
import * as Generators from '../generators';
import { type GroupElement, groupElementSum } from '../groupElement';
import { Knowledge, type Statement } from '../linearRelation';
import { Mac, generateU } from '../mac';
import {
    balanceProofStatement,
    issuerParametersStatement,
    prove,
    rangeProofStatement,
    showCredentialStatement,
    verify,
    zeroProofStatement,
} from '../proofSystem';
import { CREDENTIAL_NUMBER } from '../protocolConstants';
import { type Random } from '../random';
import { type Scalar, scalarAdd, scalarFromNumber, scalarMultiply, scalarNegate } from '../scalar';
import { buildTranscript } from '../wabiSabiClient';
import { type CredentialIssuerSecretKey } from './credentialIssuerSecretKey';

/** `ProofSystem.IssuerParametersKnowledge` — issuer side, so it lives here. */
export const issuerParametersKnowledge = (
    mac: Mac,
    ma: GroupElement,
    sk: CredentialIssuerSecretKey,
) =>
    new Knowledge(issuerParametersStatement(sk.computeCredentialIssuerParameters(), mac, ma), [
        sk.w,
        sk.wp,
        sk.x0,
        sk.x1,
        sk.ya,
    ]);

/** `MAC.ComputeMAC` — needs the secret key, so it lives here too. */
export const computeMac = (sk: CredentialIssuerSecretKey, ma: GroupElement, t: Scalar) => {
    // ComputeAlgebraicMAC((x0, x1), (w * Gw) + (ya * ma), t)
    const m = Generators.Gw.multiply(sk.w).add(ma.multiply(sk.ya));
    const u = generateU(t);

    return new Mac(t, u.multiply(scalarAdd(sk.x0, scalarMultiply(sk.x1, t))).add(m));
};

/** `CredentialPresentation.ComputeZ` — needs the secret key. */
export const computeZ = (presentation: CredentialPresentation, sk: CredentialIssuerSecretKey) =>
    presentation.cV.subtract(
        Generators.Gw.multiply(sk.w)
            .add(presentation.cx0.multiply(sk.x0))
            .add(presentation.cx1.multiply(sk.x1))
            .add(presentation.ca.multiply(sk.ya)),
    );

/**
 * Port of `NWabiSabi/WabiSabi/CredentialIssuer.cs`.
 *
 * The coordinator's component. Test-only here: it exists so that the round-phase suites
 * and the mock coordinator actually validate what the client sends — the balance proof,
 * every range proof, and a serial-number set that rejects re-presentation — instead of
 * waving structurally fake data through.
 *
 * Stateful: one instance per round, because it tracks presented serial numbers to
 * prevent credential reuse and tracks the balance so it never issues more than was
 * presented.
 */
export class CredentialIssuer {
    readonly maxAmount: number;
    readonly rangeProofWidth: number;
    readonly credentialIssuerSecretKey: CredentialIssuerSecretKey;
    readonly numberOfCredentials = CREDENTIAL_NUMBER;

    private readonly credentialIssuerParameters: CredentialIssuerParameters;
    private readonly random: Random;
    private readonly usedSerialNumbers = new Set<string>();
    private _balance = 0;

    constructor(
        credentialIssuerSecretKey: CredentialIssuerSecretKey,
        random: Random,
        maxAmount: number,
    ) {
        this.maxAmount = maxAmount;
        this.rangeProofWidth = Math.ceil(Math.log2(maxAmount));
        this.credentialIssuerSecretKey = credentialIssuerSecretKey;
        this.credentialIssuerParameters =
            credentialIssuerSecretKey.computeCredentialIssuerParameters();
        this.random = random;
    }

    get balance() {
        return this._balance;
    }

    get issuerParameters() {
        return this.credentialIssuerParameters;
    }

    handleRequest(registrationRequest: CredentialsRequest): CredentialsResponse {
        const isNullRequest = isNullRequestOf(registrationRequest);
        const { requested } = registrationRequest;
        const { presented } = registrationRequest;

        const requiredNumberOfRequested = isPresentationOnlyRequest(registrationRequest)
            ? 0
            : this.numberOfCredentials;
        if (requested.length !== requiredNumberOfRequested) {
            throw new WabiSabiCryptoError(
                WabiSabiCryptoErrorCode.InvalidNumberOfRequestedCredentials,
                `${this.numberOfCredentials} credential requests were expected but ${requested.length} were received.`,
            );
        }

        const requiredNumberOfPresentations = isNullRequest ? 0 : this.numberOfCredentials;
        if (presented.length !== requiredNumberOfPresentations) {
            throw new WabiSabiCryptoError(
                WabiSabiCryptoErrorCode.InvalidNumberOfPresentedCredentials,
                `${requiredNumberOfPresentations} credential presentations were expected but ${presented.length} were received.`,
            );
        }

        // Don't allow the balance to go negative; if it would, something upstream of
        // here is wrong.
        if (this._balance + registrationRequest.delta < 0) {
            throw new Error('Negative issuer balance');
        }

        // Check that the range proofs are of the appropriate bit width.
        const rangeProofWidth = isNullRequest ? 0 : this.rangeProofWidth;
        if (requested.some(request => request.bitCommitments.length !== rangeProofWidth)) {
            throw new WabiSabiCryptoError(WabiSabiCryptoErrorCode.InvalidBitCommitment);
        }

        // Even presenting a previously unused credential more than once in the same
        // request is a double spend, so uniqueness within the request is checked
        // separately from reuse across requests.
        if (areThereDuplicatedSerialNumbers(registrationRequest)) {
            throw new WabiSabiCryptoError(WabiSabiCryptoErrorCode.SerialNumberDuplicated);
        }

        const presentedSerialNumbers = serialNumbersOf(registrationRequest).map(serial =>
            serial.toHex(),
        );

        // The serial numbers have not been verified at this point, but a request with an
        // invalid proof and a used serial number should also be rejected.
        if (presentedSerialNumbers.some(serial => this.usedSerialNumbers.has(serial))) {
            throw new WabiSabiCryptoError(
                WabiSabiCryptoErrorCode.SerialNumberAlreadyUsed,
                'Serial number reused',
            );
        }
        presentedSerialNumbers.forEach(serial => this.usedSerialNumbers.add(serial));

        const statements: Statement[] = [];
        for (const presentation of presented) {
            // Calculate Z using the coordinator secret.
            const z = computeZ(presentation, this.credentialIssuerSecretKey);
            statements.push(
                showCredentialStatement(presentation, z, this.credentialIssuerParameters),
            );
        }

        for (const credentialRequest of requested) {
            statements.push(
                isNullRequest
                    ? zeroProofStatement(credentialRequest.ma)
                    : rangeProofStatement(
                          credentialRequest.ma,
                          credentialRequest.bitCommitments,
                          rangeProofWidth,
                      ),
            );
        }

        if (!isNullRequest) {
            const sumCa = groupElementSum(presented.map(presentation => presentation.ca));
            const sumMa = groupElementSum(requested.map(request => request.ma));

            // A positive delta means the requested credential amounts are larger than
            // the presented ones. The equation requires a commitment to 0, so the sum
            // of the presented attributes and the negated requested attributes is
            // tweaked by delta.
            const absAmountDelta = scalarFromNumber(Math.abs(registrationRequest.delta));
            const deltaA =
                registrationRequest.delta < 0 ? scalarNegate(absAmountDelta) : absAmountDelta;
            const balanceTweak = Generators.Gg.multiply(deltaA);
            statements.push(balanceProofStatement(balanceTweak.add(sumCa).subtract(sumMa)));
        }

        const transcript = buildTranscript(isNullRequest);

        let areProofsValid = false;
        try {
            areProofsValid = verify(transcript, statements, registrationRequest.proofs);
            if (!areProofsValid) {
                throw new WabiSabiCryptoError(
                    WabiSabiCryptoErrorCode.CoordinatorReceivedInvalidProofs,
                );
            }
        } finally {
            if (!areProofsValid) {
                // The request was invalid but all serial numbers were unused. Keep the
                // nullifier set from being clogged with serial numbers that never
                // mattered for double spending.
                presentedSerialNumbers.forEach(serial => this.usedSerialNumbers.delete(serial));
            }
        }

        this._balance += registrationRequest.delta;
        if (this._balance < 0) {
            throw new Error('Negative balance');
        }

        const credentials = requested.map((request: IssuanceRequest) =>
            this.issueCredential(request.ma, this.random.getScalar()),
        );
        const proofs = prove(
            transcript,
            credentials.map(credential => credential.knowledge),
            this.random,
        );

        return {
            issuedCredentials: credentials.map(credential => credential.mac),
            proofs,
        };
    }

    private issueCredential(ma: GroupElement, t: Scalar) {
        const sk = this.credentialIssuerSecretKey;
        const mac = computeMac(sk, ma, t);

        return { mac, knowledge: issuerParametersKnowledge(mac, ma, sk) };
    }
}
