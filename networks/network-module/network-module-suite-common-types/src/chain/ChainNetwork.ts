import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

import type { BackendType } from '../SuiteCommonNetworkConfig';
import type { ChainAccountBalance } from './ChainAccountBalance';
import type { ChainAccountRef } from './ChainAccountRef';
import type { ChainSyncPolicy } from './ChainSyncPolicy';
import type { ChainTokenBalance } from './ChainTokenBalance';
import type {
    ChainTransactionsPage,
    GetHistoricFiatRatesParams,
    GetTransactionsParams,
    HistoricFiatRates,
} from './ChainTransactions';
import type { FiatRate } from './FiatRate';

export type GetAccountBalanceParams = {
    ref: ChainAccountRef;
    signal: AbortSignal;
};

export type GetNativeFiatRateParams = {
    currency: BaseCurrencyCode;
    signal: AbortSignal;
};

export type GetTokenFiatRateParams = {
    contract: string;
    currency: BaseCurrencyCode;
    signal: AbortSignal;
};

export type ChainNativeAsset = {
    /** Symbol shown to the user, which can differ from the network symbol (`ETH` on Base). */
    readonly symbol: string;
    readonly name: string;
};

export type GetAccountFiatBalanceParams = {
    balance: ChainAccountBalance;
    rate: FiatRate;
};

/**
 * One selected network, bound to the backend the user chose for it.
 *
 * Shared code never asks which network family it holds; it calls these capabilities. Fetching
 * methods return plain promises so that any cache (TanStack Query on the apps) can own the data.
 *
 * @serviceContract
 */
export type ChainNetwork = {
    readonly symbol: NetworkSymbol;

    /** Scopes cached data: switching backend must not serve data fetched from the previous one. */
    readonly backendType: BackendType;
    readonly syncPolicy: ChainSyncPolicy;
    readonly nativeAsset: ChainNativeAsset;

    getAccountBalance: (params: GetAccountBalanceParams) => Promise<ChainAccountBalance>;

    /** Resolves `null` when no source knows the rate (testnets, unlisted coins). */
    getNativeFiatRate: (params: GetNativeFiatRateParams) => Promise<FiatRate | null>;

    /** Fiat value of an account's balance as a decimal string. */
    getAccountFiatBalance: (params: GetAccountFiatBalanceParams) => string;

    /**
     * Fungible tokens the account holds. Absent on networks without tokens, and on networks whose
     * tokens are not read through chain networks yet.
     */
    getTokens?: (params: GetAccountBalanceParams) => Promise<readonly ChainTokenBalance[]>;

    /** Present exactly when `getTokens` is; resolves `null` when no source knows the rate. */
    getTokenFiatRate?: (params: GetTokenFiatRateParams) => Promise<FiatRate | null>;

    /** One page of the account's history. Absent where the backend keeps no history. */
    getTransactions?: (params: GetTransactionsParams) => Promise<ChainTransactionsPage>;

    /** Rates of the coin or one of its tokens at past times, to value historic transactions. */
    getHistoricFiatRates: (params: GetHistoricFiatRatesParams) => Promise<HistoricFiatRates>;
};

export type ChainNetworkBackend = {
    readonly type: BackendType;
    readonly urls: readonly string[];
};

export type ChainNetworkParams = {
    readonly symbol: NetworkSymbol;
    readonly backend: ChainNetworkBackend;

    /** Address gap limit for UTXO account discovery, when the user changed it. */
    readonly gapLimit?: number;
};

/** @serviceContract */
export type CreateChainNetwork = (params: ChainNetworkParams) => ChainNetwork;
