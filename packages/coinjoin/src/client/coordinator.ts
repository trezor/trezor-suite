import { coordinatorRequest as request, RequestOptions } from '../utils/http';
import {
    CoinjoinStatus,
    ZeroCredentials,
    RealCredentials,
    ConfirmationData,
    IssuanceData,
    RegistrationData,
    AffiliationFlag,
} from '../types/coordinator';

export const getStatus = async (options: RequestOptions) => {
    const data = await request<CoinjoinStatus>(
        'status',
        {
            roundCheckpoints: [], // TODO: use it data saving: skipping known coinjoin.events
        },
        options,
    );
    return data;
};

export const inputRegistration = (
    roundId: string,
    input: string,
    ownershipProof: string,
    zeroAmountCredentials: ZeroCredentials,
    zeroVsizeCredentials: ZeroCredentials,
    options: RequestOptions,
) =>
    request<RegistrationData>(
        'input-registration',
        {
            roundId,
            input,
            ownershipProof,
            zeroAmountCredentialRequests: zeroAmountCredentials.credentialsRequest,
            zeroVsizeCredentialRequests: zeroVsizeCredentials.credentialsRequest,
        },
        options,
    );

export const inputUnregistration = (roundId: string, aliceId: string, options: RequestOptions) =>
    request(
        'input-unregistration',
        {
            roundId,
            aliceId,
        },
        options,
    );

export const connectionConfirmation = (
    roundId: string,
    aliceId: string,
    realAmountCredentials: RealCredentials,
    realVsizeCredentials: RealCredentials,
    zeroAmountCredentials: ZeroCredentials,
    zeroVsizeCredentials: ZeroCredentials,
    options: RequestOptions,
) =>
    request<ConfirmationData>(
        'connection-confirmation',
        {
            roundId,
            aliceId,
            zeroAmountCredentialRequests: zeroAmountCredentials.credentialsRequest,
            realAmountCredentialRequests: realAmountCredentials.credentialsRequest,
            zeroVsizeCredentialRequests: zeroVsizeCredentials.credentialsRequest,
            realVsizeCredentialRequests: realVsizeCredentials.credentialsRequest,
        },
        options,
    );

export const credentialIssuance = (
    roundId: string,
    realAmountCredentials: RealCredentials,
    realVsizeCredentials: RealCredentials,
    zeroAmountCredentials: ZeroCredentials,
    zeroVsizeCredentials: ZeroCredentials,
    options: RequestOptions,
) =>
    request<IssuanceData>(
        'credential-issuance',
        {
            roundId,
            realAmountCredentialRequests: realAmountCredentials.credentialsRequest,
            realVsizeCredentialRequests: realVsizeCredentials.credentialsRequest,
            zeroAmountCredentialRequests: zeroAmountCredentials.credentialsRequest,
            zeroVsizeCredentialsRequests: zeroVsizeCredentials.credentialsRequest,
        },
        options,
    );

export const outputRegistration = (
    roundId: string,
    output: { scriptPubKey: string },
    amountCredentials: ZeroCredentials,
    vsizeCredentials: ZeroCredentials,
    options: RequestOptions,
) =>
    request(
        'output-registration',
        {
            roundId,
            script: output.scriptPubKey,
            amountCredentialRequests: amountCredentials.credentialsRequest,
            vsizeCredentialRequests: vsizeCredentials.credentialsRequest,
        },
        options,
    );

export const readyToSign = (
    roundId: string,
    aliceId: string,
    affiliationFlag: AffiliationFlag | undefined,
    options: RequestOptions,
) =>
    request(
        'ready-to-sign',
        {
            roundId,
            aliceId,
            affiliationFlag,
        },
        options,
    );

export const transactionSignature = (
    roundId: string,
    inputIndex: number,
    witness: string,
    options: RequestOptions,
) =>
    request(
        'transaction-signature',
        {
            roundId,
            inputIndex,
            witness,
        },
        options,
    );

// reexport all coordinator types
export * from '../types/coordinator';
