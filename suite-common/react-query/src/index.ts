export {
    QueryClient,
    QueryClientProvider,
    useQueries,
    useQuery,
    useInfiniteQuery,
    useMutation,
    useQueryClient,
    queryOptions,
    type MutationOptions,
    type QueryKey,
    type QueryOptions,
    type UseQueryOptions,
    type UseQueryResult,
    type UseInfiniteQueryResult,
    type InfiniteData,
    keepPreviousData,
} from '@tanstack/react-query';
export * from './createQueryDefinition';
export * from './constants/queryKeys';
export * from './constants/mutationKeys';
// QueryClientProvider wrappers are not exported here, to keep this package compatible with nodeJS-only environments (which can't parse .tsx)
