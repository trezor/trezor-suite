import {
    CONFIDENTIAL_QUERY_META,
    chainQueryKeys,
    queryOptions,
    skipToken,
    useQuery,
} from '@suite-common/react-query';
import type {
    ChainAccountNonce,
    ChainAccountRef,
    ChainNetwork,
} from '@trezor/network-module-suite-common-types';

// A nonce shown from a failed read would mislead; one retry covers a dropped connection.
const RETRY_COUNT = 1;

export type ChainAccountNonceQueryParams = {
    network: ChainNetwork;
    ref: ChainAccountRef;
    enabled: boolean;
};

/**
 * Where an account's nonce stands. It sits under the account's key, so whatever refreshes the
 * account (a broadcast, a backend notification) reads it again; never fetched on a network
 * without account nonces.
 */
export const getChainAccountNonceQueryOptions = ({
    network,
    ref,
    enabled,
}: ChainAccountNonceQueryParams) => {
    const { getAccountNonce } = network;

    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- cache identity is symbol + backend + descriptor; the network object and the connection identity they select never belong in a key
    return queryOptions<ChainAccountNonce>({
        queryKey: chainQueryKeys.accountNonce(network.symbol, network.backendType, ref.descriptor),
        queryFn:
            enabled && getAccountNonce
                ? ({ signal }) => getAccountNonce({ ref, signal })
                : skipToken,
        staleTime: network.syncPolicy.accountStaleTimeMs,
        refetchInterval: network.syncPolicy.accountRefetchIntervalMs,
        refetchIntervalInBackground: false,
        retry: RETRY_COUNT,
        meta: CONFIDENTIAL_QUERY_META,
    });
};

export type UseChainAccountNonceParams = {
    /** `undefined` while the account's network is not selected. */
    network: ChainNetwork | undefined;
    ref: ChainAccountRef | null;
    enabled: boolean;
};

/** The account's nonce as its network resolves it, refreshed while it is shown. */
export const useChainAccountNonce = ({ network, ref, enabled }: UseChainAccountNonceParams) =>
    useQuery(
        network && ref
            ? getChainAccountNonceQueryOptions({ network, ref, enabled })
            : { queryKey: chainQueryKeys.all('uncovered'), queryFn: skipToken },
    );
