export {
    QueryClient,
    QueryClientProvider,
    useQuery,
    useQueries,
    queryOptions,
    skipToken,
    useInfiniteQuery,
    useMutation,
    useQueryClient,
    type MutationOptions,
    type QueryOptions,
    type UseQueryOptions,
    type UseQueryResult,
    type UseInfiniteQueryResult,
    type InfiniteData,
    type QueryKey,
    keepPreviousData,
} from '@tanstack/react-query';
export * from './constants/queryKeys';
export { CONFIDENTIAL_QUERY_META, createQueryClient } from './createQueryClient';
export type { QueryClientPlatform } from './createQueryClient';
export * from './constants/mutationKeys';
// QueryClientProvider wrappers are not exported here, to keep this package compatible with nodeJS-only environments (which can't parse .tsx)
