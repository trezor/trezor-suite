import { coordinatorRequest, RequestOptions } from './coordinatorRequest';
import { patchResponse } from '../utils/http';
import {
    CoinjoinStatus,
    ZeroCredentials,
    RealCredentials,
    ConfirmationData,
    IssuanceData,
    RegistrationData,
} from '../types/coordinator';
import { AFFILIATION_ID } from '../constants';

const request = <T>(...args: Parameters<typeof coordinatorRequest>) =>
    coordinatorRequest<T>(...args).then(result => patchResponse(result));

export const getStatus = async (options: RequestOptions) => {
    const data = await request<CoinjoinStatus>(
        'status',
        {
            RoundCheckpoints: [], // TODO: use it data saving: skipping known coinjoin.events
        },
        options,
    );
    return data;
};

export const inputRegistration = (
    RoundId: string,
    input: string,
    ownershipProof: string,
    zeroAmountCredentials: ZeroCredentials,
    zeroVsizeCredentials: ZeroCredentials,
    options: RequestOptions,
) =>
    request<RegistrationData>(
        'input-registration',
        {
            RoundId,
            Input: input.toUpperCase(),
            OwnershipProof: ownershipProof.toUpperCase(),
            ZeroAmountCredentialRequests: zeroAmountCredentials.credentialsRequest,
            ZeroVsizeCredentialRequests: zeroVsizeCredentials.credentialsRequest,
        },
        options,
    );

export const inputUnregistration = (RoundId: string, AliceId: string, options: RequestOptions) =>
    request(
        'input-unregistration',
        {
            RoundId,
            AliceId,
        },
        options,
    );

export const connectionConfirmation = (
    RoundId: string,
    AliceId: string,
    realAmountCredentials: RealCredentials,
    realVsizeCredentials: RealCredentials,
    zeroAmountCredentials: ZeroCredentials,
    zeroVsizeCredentials: ZeroCredentials,
    options: RequestOptions,
) =>
    request<ConfirmationData>(
        'connection-confirmation',
        {
            RoundId,
            AliceId,
            ZeroAmountCredentialRequests: zeroAmountCredentials.credentialsRequest,
            RealAmountCredentialRequests: realAmountCredentials.credentialsRequest,
            ZeroVsizeCredentialRequests: zeroVsizeCredentials.credentialsRequest,
            RealVsizeCredentialRequests: realVsizeCredentials.credentialsRequest,
        },
        options,
    );

export const credentialIssuance = (
    RoundId: string,
    realAmountCredentials: RealCredentials,
    realVsizeCredentials: RealCredentials,
    zeroAmountCredentials: ZeroCredentials,
    zeroVsizeCredentials: ZeroCredentials,
    options: RequestOptions,
) =>
    request<IssuanceData>(
        'credential-issuance',
        {
            RoundId,
            RealAmountCredentialRequests: realAmountCredentials.credentialsRequest,
            RealVsizeCredentialRequests: realVsizeCredentials.credentialsRequest,
            ZeroAmountCredentialRequests: zeroAmountCredentials.credentialsRequest,
            ZeroVsizeCredentialsRequests: zeroVsizeCredentials.credentialsRequest,
        },
        options,
    );

export const outputRegistration = (
    RoundId: string,
    output: { scriptPubKey: string },
    amountCredentials: ZeroCredentials,
    vsizeCredentials: ZeroCredentials,
    options: RequestOptions,
) =>
    request(
        'output-registration',
        {
            RoundId,
            Script: output.scriptPubKey,
            AmountCredentialRequests: amountCredentials.credentialsRequest,
            VsizeCredentialRequests: vsizeCredentials.credentialsRequest,
        },
        options,
    );

export const readyToSign = (
    RoundId: string,
    AliceId: string,
    affiliationFlag: boolean,
    options: RequestOptions,
) =>
    request(
        'ready-to-sign',
        {
            RoundId,
            AliceId,
            // NOTE: if affiliationFlag is not set behave as WalletWasabi clients
            AffiliationId: affiliationFlag ? AFFILIATION_ID.trezor : AFFILIATION_ID.wasabi,
        },
        options,
    );

export const transactionSignature = (
    RoundId: string,
    InputIndex: number,
    witness: string,
    options: RequestOptions,
) =>
    request(
        'transaction-signature',
        {
            RoundId,
            InputIndex,
            Witness: witness.toUpperCase(),
        },
        options,
    );

export { WabiSabiProtocolException } from './coordinatorRequest';

// reexport all coordinator types
export * from '../types/coordinator';
