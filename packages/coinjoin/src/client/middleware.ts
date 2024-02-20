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
    AmountsToRequest: number[],
    CredentialsToPresent: Credentials[],
    CredentialIssuerParameters: IssuerParameter,
    MaxCredentialValue: number,
    options: RequestOptions,
) => {
    const data = await request<{ RealCredentialRequests: RealCredentials }>(
        'get-real-credential-requests',
        {
            AmountsToRequest,
            CredentialIssuerParameters,
            MaxCredentialValue,
            CredentialsToPresent,
        },
        options,
    );

    return data.RealCredentialRequests;
};

export const getZeroCredentials = async (issuer: IssuerParameter, options: RequestOptions) => {
    const data = await request<{ ZeroCredentialRequests: ZeroCredentials }>(
        'get-zero-credential-requests',
        {
            CredentialIssuerParameters: issuer,
        },
        options,
    );

    return data.ZeroCredentialRequests;
};

export const getCredentials = async (
    CredentialIssuerParameters: IssuerParameter,
    CredentialsResponse: RealCredentials,
    CredentialsValidationData: CredentialsResponseValidation,
    options: RequestOptions,
) => {
    const data = await request<{ Credentials: Credentials[] }>(
        'get-credentials',
        {
            CredentialIssuerParameters,
            CredentialsResponse,
            CredentialsValidationData,
        },
        options,
    );

    return data.Credentials;
};

export const getOutputsAmounts = async (
    body: {
        InputSize: number;
        OutputSize: number;
        AvailableVsize: number;
        MiningFeeRate: number;
        AllowedOutputAmounts: AllowedRange;
        InternalAmounts: number[];
        ExternalAmounts: number[];
    },
    options: RequestOptions,
) => {
    const data = await request<{ OutputAmounts: number[] }>('get-outputs-amounts', body, options);

    return data.OutputAmounts;
};

export const selectInputsForRound = async (
    body: {
        AllowedInputTypes: AllowedScriptTypes[];
        CoordinationFeeRate: CoordinationFeeRate;
        MiningFeeRate: number;
        AllowedInputAmounts: AllowedRange;
        AllowedOutputAmounts: AllowedRange;
        Utxos: UtxoForRound[];
        AnonScoreTarget: number;
        LiquidityClue: number;
        SemiPrivateThreshold: number;
        ConsolidationMode: boolean;
    },
    options: RequestOptions,
) => {
    const data = await request<{ Indices: number[] }>('select-inputs-for-round', body, options);

    return data.Indices;
};

export const getAnonymityScores = async (
    Transactions: AnalyzeTransactionDetails[],
    options: RequestOptions,
) => {
    const data = await request<AnalyzeResult>('get-anonymity-scores', { Transactions }, options);

    return data.Results;
};

export const initLiquidityClue = async (ExternalAmounts: number[], options: RequestOptions) => {
    const data = await request<{ RawLiquidityClue: RawLiquidityClue }>(
        'init-liquidity-clue',
        { ExternalAmounts },
        options,
    );

    return data.RawLiquidityClue;
};

export const updateLiquidityClue = async (
    rawLiquidityClue: RawLiquidityClue,
    MaxSuggestedAmount: number,
    ExternalAmounts: number[],
    options: RequestOptions,
) => {
    const data = await request<{ RawLiquidityClue: RawLiquidityClue }>(
        'update-liquidity-clue',
        { RawLiquidityClue: rawLiquidityClue, MaxSuggestedAmount, ExternalAmounts },
        options,
    );

    return data.RawLiquidityClue;
};

export const getLiquidityClue = async (
    rawLiquidityClue: RawLiquidityClue,
    maxSuggestedAmount: number,
    options: RequestOptions,
) => {
    const data = await request<{ LiquidityClue: number }>(
        'get-liquidity-clue',
        { rawLiquidityClue, maxSuggestedAmount },
        options,
    );

    return data.LiquidityClue;
};

// reexport all middleware types
export * from '../types/middleware';
