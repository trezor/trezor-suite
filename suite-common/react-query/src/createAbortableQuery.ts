import type { DefaultError, QueryExecuteOptions, QueryKey, StaleTime } from '@tanstack/react-query';

import { promiseRaceWithSignal } from '@trezor/utils';

import type { QueryClientDep } from './createQueryClient';

/**
 * The query options that do not depend on the query's data, so one value serves every query.
 * `staleTime` takes its plain value only, since its function form reads the query and so its data.
 */
export type AbortableQueryDefaultOptions = Pick<
    QueryExecuteOptions,
    'gcTime' | 'retry' | 'retryDelay' | 'networkMode' | 'meta'
> & {
    staleTime?: StaleTime;
};

export type AbortableQueryOptions<
    TQueryFnData,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
> = QueryExecuteOptions<TQueryFnData, DefaultError, TData, TQueryFnData, TQueryKey> & {
    signal?: AbortSignal;
};

export type AbortableQueryDeps = QueryClientDep & {
    defaultOptions?: AbortableQueryDefaultOptions;
};

export type AbortableQuery = <
    TQueryFnData,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
>(
    options: AbortableQueryOptions<TQueryFnData, TData, TQueryKey>,
) => Promise<TData>;

/**
 * Creates a `queryClient.query` for callers with their own abort signal,
 * applying the default options, which each caller's options override.
 * The query client takes no signal from its caller: the query function gets one of the query's own,
 * which TanStack aborts only when the query itself is cancelled.
 * So a caller's signal stops only that caller's wait, never the fetch that concurrent callers of the key share.
 */
export const createAbortableQuery =
    (deps: AbortableQueryDeps): AbortableQuery =>
    <TQueryFnData, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>({
        signal,
        ...queryOptions
    }: AbortableQueryOptions<TQueryFnData, TData, TQueryKey>): Promise<TData> =>
        promiseRaceWithSignal(
            deps.queryClient.query<TQueryFnData, DefaultError, TData, TQueryFnData, TQueryKey>({
                ...deps.defaultOptions,
                ...queryOptions,
            }),
            signal,
        );
