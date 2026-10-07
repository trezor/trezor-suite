import {
    CONFIDENTIAL_QUERY_META,
    chainQueryKeys,
    queryOptions,
    skipToken,
} from '@suite-common/react-query';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import type {
    ChainAccountBalance,
    ChainAccountRef,
    ChainNetwork,
    ChainTokenBalance,
} from '@trezor/network-module-suite-common-types';

// A failed balance is shown from the last known value; one retry covers a dropped connection
// without multiplying load on a struggling backend.
const RETRY_COUNT = 1;

export type ChainAccountBalanceQueryParams = {
    network: ChainNetwork;
    ref: ChainAccountRef;
    enabled: boolean;
};

/**
 * The single definition of an account balance query, so every caller lands on one cache entry and
 * one request. The network owns the refresh policy; the backend type scopes the entry.
 */
export const getChainAccountBalanceQueryOptions = (params: ChainAccountBalanceQueryParams) =>
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- cache identity is symbol + backend + descriptor; the network object and the connection identity they select never belong in a key
    queryOptions<ChainAccountBalance>({
        queryKey: chainQueryKeys.accountBalance(
            params.network.symbol,
            params.network.backendType,
            params.ref.descriptor,
        ),
        queryFn: params.enabled
            ? ({ signal }) => params.network.getAccountBalance({ ref: params.ref, signal })
            : skipToken,
        staleTime: params.network.syncPolicy.accountStaleTimeMs,
        refetchInterval: params.network.syncPolicy.accountRefetchIntervalMs,
        refetchIntervalInBackground: false,
        retry: RETRY_COUNT,
        meta: CONFIDENTIAL_QUERY_META,
    });

export type NativeFiatRateQueryParams = {
    network: ChainNetwork;
    currency: BaseCurrencyCode;
    enabled: boolean;
};

export const getNativeFiatRateQueryOptions = (params: NativeFiatRateQueryParams) =>
    queryOptions({
        queryKey: chainQueryKeys.nativeFiatRate(
            params.network.symbol,
            params.network.backendType,
            params.currency,
        ),
        queryFn: params.enabled
            ? ({ signal }) =>
                  params.network.getNativeFiatRate({ currency: params.currency, signal })
            : skipToken,
        staleTime: params.network.syncPolicy.fiatRateStaleTimeMs,
        refetchInterval: params.network.syncPolicy.fiatRateRefetchIntervalMs,
        refetchIntervalInBackground: false,
        retry: RETRY_COUNT,
    });

export type ChainAccountTokensQueryParams = ChainAccountBalanceQueryParams;

// Watching another token changes what to fetch, so the watched set is part of the key.
const getWatchedTokensKey = (ref: ChainAccountRef) =>
    [...(ref.watchedTokens ?? [])].sort().join(',');

/** Tokens of one chain account; never fetched on a network without token capabilities. */
export const getChainAccountTokensQueryOptions = (params: ChainAccountTokensQueryParams) => {
    const { getTokens } = params.network;

    return queryOptions<readonly ChainTokenBalance[]>({
        queryKey: chainQueryKeys.accountTokens(
            params.network.symbol,
            params.network.backendType,
            params.ref.descriptor,
            getWatchedTokensKey(params.ref),
        ),
        queryFn:
            params.enabled && getTokens
                ? ({ signal }) => getTokens({ ref: params.ref, signal })
                : skipToken,
        staleTime: params.network.syncPolicy.accountStaleTimeMs,
        refetchInterval: params.network.syncPolicy.accountRefetchIntervalMs,
        refetchIntervalInBackground: false,
        retry: RETRY_COUNT,
        meta: CONFIDENTIAL_QUERY_META,
    });
};

export type TokenFiatRateQueryParams = {
    network: ChainNetwork;
    contract: string;
    currency: BaseCurrencyCode;
    enabled: boolean;
};

export const getTokenFiatRateQueryOptions = (params: TokenFiatRateQueryParams) => {
    const { getTokenFiatRate } = params.network;

    return queryOptions({
        queryKey: chainQueryKeys.tokenFiatRate(
            params.network.symbol,
            params.network.backendType,
            params.contract,
            params.currency,
        ),
        queryFn:
            params.enabled && getTokenFiatRate
                ? ({ signal }) =>
                      getTokenFiatRate({
                          contract: params.contract,
                          currency: params.currency,
                          signal,
                      })
                : skipToken,
        staleTime: params.network.syncPolicy.fiatRateStaleTimeMs,
        refetchInterval: params.network.syncPolicy.fiatRateRefetchIntervalMs,
        refetchIntervalInBackground: false,
        retry: RETRY_COUNT,
    });
};
