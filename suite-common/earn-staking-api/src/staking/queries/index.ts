import {
    type AbortableQuery,
    type AbortableQueryDefaultOptions,
    type QueryClient,
    type QueryClientDep,
    type QueryExecuteOptions,
    SILENT_QUERY_META,
    commonQueryKeys,
    createAbortableQuery,
} from '@suite-common/react-query';

import type { AdaPools, EthOrSolStats, EthValidatorsQueue, TrxStats } from '../../api/types';
import {
    getCardanoPools,
    getEthereumValidatorsQueue,
    getStakingStats,
    getTronStakingStats,
} from '../services';

/**
 * TanStack options a staking query takes on top of its request.
 * The endpoint owns the query key and function, and `select` would change what the request returns.
 */
export type StakingQueryOptions<TData> = Omit<
    QueryExecuteOptions<TData>,
    'queryKey' | 'queryFn' | 'select'
>;

/**
 * The staking product info query around these requests decides when its info is stale,
 * retries, fetches offline and reports failures,
 * so by default a request is shared only while it is in flight and does none of that on its own.
 */
const SHARED_REQUEST_QUERY_OPTIONS: AbortableQueryDefaultOptions = {
    staleTime: 0,
    retry: false,
    networkMode: 'always',
    meta: SILENT_QUERY_META,
};

const createStakingAbortableQuery = (queryClient: QueryClient): AbortableQuery =>
    createAbortableQuery({ queryClient, defaultOptions: SHARED_REQUEST_QUERY_OPTIONS });

export type StakingStatsQueryParams = Parameters<typeof getStakingStats>[0] &
    StakingQueryOptions<EthOrSolStats>;

export type EthereumValidatorsQueueQueryParams = NonNullable<
    Parameters<typeof getEthereumValidatorsQueue>[0]
> &
    StakingQueryOptions<EthValidatorsQueue>;

export type CardanoPoolsQueryParams = NonNullable<Parameters<typeof getCardanoPools>[0]> &
    StakingQueryOptions<AdaPools>;

export type TronStakingStatsQueryParams = NonNullable<Parameters<typeof getTronStakingStats>[0]> &
    StakingQueryOptions<TrxStats>;

const createStakingStatsQuery =
    (abortableQuery: AbortableQuery) =>
    ({ routeParams: { networkSymbol }, ...queryOptions }: StakingStatsQueryParams) =>
        abortableQuery({
            ...queryOptions,
            queryKey: commonQueryKeys.stakingStats(networkSymbol),
            queryFn: ({ signal }) => getStakingStats({ routeParams: { networkSymbol }, signal }),
        });

const createEthereumValidatorsQueueQuery =
    (abortableQuery: AbortableQuery) =>
    ({ params, ...queryOptions }: EthereumValidatorsQueueQueryParams = {}) =>
        abortableQuery({
            ...queryOptions,
            queryKey: commonQueryKeys.stakingValidatorsQueue(params),
            queryFn: ({ signal }) => getEthereumValidatorsQueue({ params, signal }),
        });

const createCardanoPoolsQuery =
    (abortableQuery: AbortableQuery) =>
    ({ params, ...queryOptions }: CardanoPoolsQueryParams = {}) =>
        abortableQuery({
            ...queryOptions,
            queryKey: commonQueryKeys.stakingCardanoPools(params),
            queryFn: ({ signal }) => getCardanoPools({ params, signal }),
        });

const createTronStakingStatsQuery =
    (abortableQuery: AbortableQuery) =>
    (queryOptions: TronStakingStatsQueryParams = {}) =>
        abortableQuery({
            ...queryOptions,
            queryKey: commonQueryKeys.stakingStats('trx'),
            queryFn: ({ signal }) => getTronStakingStats({ signal }),
        });

export const createEthereumStakingApi = ({ queryClient }: QueryClientDep) => {
    const abortableQuery = createStakingAbortableQuery(queryClient);

    return {
        getStakingStats: createStakingStatsQuery(abortableQuery),
        getEthereumValidatorsQueue: createEthereumValidatorsQueueQuery(abortableQuery),
    };
};

export type EthereumStakingApi = ReturnType<typeof createEthereumStakingApi>;

export const createSolanaStakingApi = ({ queryClient }: QueryClientDep) => ({
    getStakingStats: createStakingStatsQuery(createStakingAbortableQuery(queryClient)),
});

export type SolanaStakingApi = ReturnType<typeof createSolanaStakingApi>;

export const createCardanoStakingApi = ({ queryClient }: QueryClientDep) => ({
    getCardanoPools: createCardanoPoolsQuery(createStakingAbortableQuery(queryClient)),
});

export type CardanoStakingApi = ReturnType<typeof createCardanoStakingApi>;

export const createTronStakingApi = ({ queryClient }: QueryClientDep) => ({
    getTronStakingStats: createTronStakingStatsQuery(createStakingAbortableQuery(queryClient)),
});

export type TronStakingApi = ReturnType<typeof createTronStakingApi>;
