import type { GeneralPrecomposedLevels } from './PrecomposedTransaction';

export type ComposeFeeLevelsError = {
    error: 'fee-levels-compose-failed';
    message?: string;
};

export type ComposeTransactionFeeLevelsContext<TSymbol extends string> = {
    account: {
        symbol: TSymbol;
    };
};

export type ComposeTransactionFeeLevelsArgs<TSymbol extends string> = {
    formState: unknown;
    composeContext: ComposeTransactionFeeLevelsContext<TSymbol>;
    isNetworkReserveEnabled?: boolean;
};

export type ComposeTransactionFeeLevelsResult = GeneralPrecomposedLevels | ComposeFeeLevelsError;

export type ComposeTransactionFeeLevels<TSymbol extends string> = (
    args: ComposeTransactionFeeLevelsArgs<TSymbol>,
) => Promise<ComposeTransactionFeeLevelsResult>;
