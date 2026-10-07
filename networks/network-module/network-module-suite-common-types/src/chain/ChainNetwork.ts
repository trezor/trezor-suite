import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

import type { BackendType } from '../SuiteCommonNetworkConfig';
import type { ChainAccountBalance } from './ChainAccountBalance';
import type { ChainAccountRef } from './ChainAccountRef';
import type { ChainSyncPolicy } from './ChainSyncPolicy';
import type { FiatRate } from './FiatRate';

export type GetAccountBalanceParams = {
    ref: ChainAccountRef;
    signal: AbortSignal;
};

export type GetNativeFiatRateParams = {
    currency: BaseCurrencyCode;
    signal: AbortSignal;
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

    getAccountBalance: (params: GetAccountBalanceParams) => Promise<ChainAccountBalance>;

    /** Resolves `null` when no source knows the rate (testnets, unlisted coins). */
    getNativeFiatRate: (params: GetNativeFiatRateParams) => Promise<FiatRate | null>;

    /** Fiat value of an account's balance as a decimal string. */
    getAccountFiatBalance: (params: GetAccountFiatBalanceParams) => string;
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
