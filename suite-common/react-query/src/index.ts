export {
    QueryClient,
    QueryClientProvider,
    useQuery,
    useInfiniteQuery,
    useMutation,
    useQueryClient,
    type MutationOptions,
    type QueryOptions,
    type UseQueryOptions,
    type UseQueryResult,
    type UseInfiniteQueryResult,
    type InfiniteData,
    keepPreviousData,
} from '@tanstack/react-query';
export * from './constants/queryKeys';
export * from './constants/mutationKeys';
// QueryClientProvider wrappers are not exported here, to keep this package compatible with nodeJS-only environments (which can't parse .tsx)
