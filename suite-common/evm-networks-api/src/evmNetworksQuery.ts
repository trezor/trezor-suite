import {
    type QueryClient,
    SILENT_QUERY_META,
    commonQueryKeys,
    queryOptions,
    useQuery,
} from '@suite-common/react-query';

import {
    type EvmNetwork,
    type EvmNetworksResponse,
    getChainIdFromCaip2,
} from './evmNetworksContract';
import { getEvmNetworksFixture } from './evmNetworksFixture';

// Fetched at most once per app run. `staleTime` covers a success; a failure leaves the query without
// data, which counts as stale, so the mount, focus and reconnect refetches are switched off as well.
export const evmNetworksQueryOptions = queryOptions({
    queryKey: commonQueryKeys.evmNetworks(),
    // TODO: Switch to `({ signal }) => fetchEvmNetworks({ signal })` once the service is deployed.
    queryFn: () => Promise.resolve(getEvmNetworksFixture()),
    staleTime: Infinity,
    gcTime: Infinity,
    retryOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    meta: SILENT_QUERY_META,
});

export const useEvmNetworksQuery = () => useQuery(evmNetworksQueryOptions);

/**
 * Reads the networks the startup prefetch left in the cache without fetching them, so a capability
 * check never waits on, or triggers, a request.
 */
export const useCachedEvmNetworks = (): readonly EvmNetwork[] | undefined =>
    useQuery({ ...evmNetworksQueryOptions, enabled: false }).data?.networks;

export const getCachedEvmNetworks = (queryClient: QueryClient): readonly EvmNetwork[] | undefined =>
    queryClient.getQueryData<EvmNetworksResponse>(evmNetworksQueryOptions.queryKey)?.networks;

// The cached list keeps its identity for the whole run, so it is indexed once, not on every
// capability check of a render.
const networksByChainIdCache = new WeakMap<readonly EvmNetwork[], Map<number, EvmNetwork>>();

const getNetworksByChainId = (networks: readonly EvmNetwork[]) => {
    const cachedIndex = networksByChainIdCache.get(networks);

    if (cachedIndex) {
        return cachedIndex;
    }

    const index = new Map(
        networks.flatMap(network => {
            const chainId = getChainIdFromCaip2(network.caip2);

            return chainId === undefined ? [] : [[chainId, network] as const];
        }),
    );
    networksByChainIdCache.set(networks, index);

    return index;
};

export const findEvmNetworkByChainId = (
    networks: readonly EvmNetwork[] | undefined,
    chainId: number,
): EvmNetwork | undefined => (networks ? getNetworksByChainId(networks).get(chainId) : undefined);
