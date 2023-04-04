import { coordinatorRequest as request, RequestOptions } from './coordinatorRequest';
import {
    AllowedRange,
    AllowedScriptTypes,
    IssuerParameter,
    ZeroCredentials,
    RealCredentials,
    CredentialsResponseValidation,
    CoordinationFeeRate,
} from '../types/coordinator';
import {
    Credentials,
    UtxoForRound,
    AnalyzeTransactionDetails,
    AnalyzeResult,
    RawLiquidityClue,
} from '../types/middleware';

export const getRealCredentials = async (
    amountsToRequest: number[],
    credentialsToPresent: Credentials[],
    credentialIssuerParameters: IssuerParameter,
    maxCredentialValue: number,
    options: RequestOptions,
) => {
    const data = await request<{ realCredentialRequests: RealCredentials }>(
        'get-real-credential-requests',
        {
            amountsToRequest,
            credentialIssuerParameters,
            maxCredentialValue,
            credentialsToPresent,
        },
        options,
    );
    return data.realCredentialRequests;
};

export const getZeroCredentials = async (issuer: IssuerParameter, options: RequestOptions) => {
    const data = await request<{ zeroCredentialRequests: ZeroCredentials }>(
        'get-zero-credential-requests',
        {
            credentialIssuerParameters: issuer,
        },
        options,
    );
    return data.zeroCredentialRequests;
};

export const getCredentials = async (
    credentialIssuerParameters: IssuerParameter,
    credentialsResponse: RealCredentials,
    credentialsValidationData: CredentialsResponseValidation,
    options: RequestOptions,
) => {
    const data = await request<{ credentials: Credentials[] }>(
        'get-credentials',
        {
            credentialIssuerParameters,
            credentialsResponse,
            credentialsValidationData,
        },
        options,
    );
    return data.credentials;
};

export const getOutputsAmounts = async (
    body: {
        inputSize: number;
        outputSize: number;
        availableVsize: number;
        miningFeeRate: number;
        allowedOutputAmounts: AllowedRange;
        internalAmounts: number[];
        externalAmounts: number[];
    },
    options: RequestOptions,
) => {
    const data = await request<{ outputAmounts: number[] }>('get-outputs-amounts', body, options);
    return data.outputAmounts;
};

export const selectInputsForRound = async (
    body: {
        allowedInputTypes: AllowedScriptTypes[];
        coordinationFeeRate: CoordinationFeeRate;
        miningFeeRate: number;
        allowedInputAmounts: AllowedRange;
        allowedOutputAmounts: AllowedRange;
        utxos: UtxoForRound[];
        anonScoreTarget: number;
        liquidityClue: number;
        semiPrivateThreshold: number;
        consolidationMode: boolean;
    },
    options: RequestOptions,
) => {
    const data = await request<{ indices: number[] }>('select-inputs-for-round', body, options);
    return data.indices;
};

export const getAnonymityScores = async (
    transactions: AnalyzeTransactionDetails[],
    options: RequestOptions,
) => {
    const data = await request<AnalyzeResult>('get-anonymity-scores', { transactions }, options);

    return data.results;
};

export const initLiquidityClue = async (externalAmounts: number[], options: RequestOptions) => {
    const data = await request<{ rawLiquidityClue: RawLiquidityClue }>(
        'init-liquidity-clue',
        { externalAmounts },
        options,
    );
    return data.rawLiquidityClue;
};

export const updateLiquidityClue = async (
    rawLiquidityClue: RawLiquidityClue,
    maxSuggestedAmount: number,
    externalAmounts: number[],
    options: RequestOptions,
) => {
    const data = await request<{ rawLiquidityClue: RawLiquidityClue }>(
        'update-liquidity-clue',
        { rawLiquidityClue, maxSuggestedAmount, externalAmounts },
        options,
    );
    return data.rawLiquidityClue;
};

export const getLiquidityClue = async (
    rawLiquidityClue: RawLiquidityClue,
    maxSuggestedAmount: number,
    options: RequestOptions,
) => {
    const data = await request<{ liquidityClue: number }>(
        'get-liquidity-clue',
        { rawLiquidityClue, maxSuggestedAmount },
        options,
    );
    return data.liquidityClue;
};

// reexport all middleware types
export * from '../types/middleware';
