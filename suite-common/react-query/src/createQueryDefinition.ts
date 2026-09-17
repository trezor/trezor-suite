import {
    type QueryKey,
    type UseQueryOptions,
    queryOptions,
    useQueries,
    useQuery,
} from '@tanstack/react-query';

/**
 * Everything a call site may still decide for itself. The key and the fetcher are not on the list:
 * they are what makes two uses of the same definition one cache entry.
 */
export type QueryDefinitionOptions<TData> = Omit<
    UseQueryOptions<TData, Error, TData, QueryKey>,
    'queryKey' | 'queryFn'
>;

export interface QueryDefinitionConfig<TParams, TData> {
    /** The one place a key for this data is spelled out. */
    queryKey: (params: TParams) => QueryKey;
    queryFn: (params: TParams) => Promise<TData>;
    /** The cache policy every use of this query inherits. */
    options?: QueryDefinitionOptions<TData>;
}

/**
 * Declares a query once — its key, its fetcher and how long its answer keeps — so that a component
 * asking for the data only says which input it wants it for.
 *
 * Two components asking for the same input share the fetch and the cache entry, whether they ask
 * one at a time (`use`), many at once (`useMany`), or through `options` handed to `useQueries`,
 * `prefetchQuery` or `invalidateQueries`.
 */
export const createQueryDefinition = <TParams, TData>({
    queryKey,
    queryFn,
    options: defaultOptions,
}: QueryDefinitionConfig<TParams, TData>) => {
    /** Ready-made options — for `useQueries`, `prefetchQuery`, `ensureQueryData`, … */
    const buildOptions = (params: TParams, overrides?: QueryDefinitionOptions<TData>) =>
        queryOptions<TData, Error, TData, QueryKey>({
            ...defaultOptions,
            ...overrides,
            queryKey: queryKey(params),
            queryFn: () => queryFn(params),
        });

    /** One instance of the query. */
    const useDefinedQuery = (params: TParams, overrides?: QueryDefinitionOptions<TData>) =>
        useQuery(buildOptions(params, overrides));

    /** The same query for many inputs, fetched in parallel and cached one entry per input. */
    const useDefinedQueries = (
        params: readonly TParams[],
        overrides?: QueryDefinitionOptions<TData>,
    ) =>
        useQueries({
            queries: params.map(item => buildOptions(item, overrides)),
        });

    return {
        /** For reading or invalidating the cache without mounting the query. */
        key: queryKey,
        options: buildOptions,
        use: useDefinedQuery,
        useMany: useDefinedQueries,
    };
};

export type QueryDefinition<TParams, TData> = ReturnType<
    typeof createQueryDefinition<TParams, TData>
>;
