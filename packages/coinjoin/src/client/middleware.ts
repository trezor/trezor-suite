import { coordinatorRequest as request, RequestOptions } from '../utils/http';
import {
    AllowedRange,
    AllowedScriptTypes,
    IssuerParameter,
    ZeroCredentials,
    RealCredentials,
    CredentialsResponseValidation,
} from '../types/coordinator';
import {
    Credentials,
    UtxoForRound,
    AnalyzeTransactionDetails,
    AnalyzeResult,
} from '../types/middleware';

export const getRealCredentials = async (
    amountsToRequest: number[],
    credentialsToPresent: Credentials[],
    credentialIssuerParameters: IssuerParameter,
    maxCredentialValue: number,
    options: RequestOptions,
) => {
    const data = await request<{ realCredentialsRequestData: RealCredentials }>(
        'create-request',
        {
            amountsToRequest,
            credentialIssuerParameters,
            maxCredentialValue,
            credentialsToPresent,
        },
        options,
    );
    return data.realCredentialsRequestData;
};

export const getZeroCredentials = async (issuer: IssuerParameter, options: RequestOptions) => {
    const data = await request<{ zeroCredentialsRequestData: ZeroCredentials }>(
        'create-request-for-zero-amount',
        {
            credentialIssuerParameters: issuer,
        },
        options,
    );
    return data.zeroCredentialsRequestData;
};

export const getCredentials = async (
    credentialIssuerParameters: IssuerParameter,
    registrationResponse: RealCredentials,
    registrationValidationData: CredentialsResponseValidation,
    options: RequestOptions,
) => {
    const data = await request<{ credentials: Credentials[] }>(
        'handle-response',
        {
            credentialIssuerParameters,
            registrationResponse,
            registrationValidationData,
        },
        options,
    );
    return data.credentials;
};

export const decomposeAmounts = async (
    constants: { feeRate: number; allowedOutputAmounts: AllowedRange },
    outputSize: number,
    availableVsize: number,
    internalAmounts: number[],
    externalAmounts: number[],
    options: RequestOptions,
) => {
    const data = await request<{ outputAmounts: number[] }>(
        'decompose-amounts',
        {
            constants,
            outputSize,
            availableVsize,
            internalAmounts,
            externalAmounts,
            strategy: 'minimum_cost',
        },
        options,
    );
    return data.outputAmounts;
};

export const selectUtxoForRound = async (
    constants: {
        allowedInputTypes: AllowedScriptTypes[];
        coordinationFeeRate: any;
        miningFeeRate: number;
        allowedInputAmounts: AllowedRange;
        allowedOutputAmounts: AllowedRange;
    },
    utxos: UtxoForRound[],
    anonScoreTarget: number,
    options: RequestOptions,
) => {
    const data = await request<{ indices: number[] }>(
        'select-utxo-for-round',
        {
            utxos,
            constants,
            anonScoreTarget,
        },
        options,
    );
    return data.indices;
};

export const analyzeTransactions = async (
    transactions: AnalyzeTransactionDetails[],
    options: RequestOptions,
) => {
    const data = await request<AnalyzeResult>('analyze-transaction', { transactions }, options);
    return data.results;
};
