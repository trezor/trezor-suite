import type { UseQueryResult } from '@suite-common/react-query';

export type CombinedQueryResults<TData> = {
    data: readonly (TData | undefined)[];
    isPending: boolean;
    hasErrors: boolean;
};

/**
 * `combine` for `useQueries`. Pass it at module level (or instantiated as
 * `combineQueryResults<T>`), so its identity is stable and the observer memoizes the result.
 */
export const combineQueryResults = <TData>(
    results: readonly UseQueryResult<TData>[],
): CombinedQueryResults<TData> => ({
    data: results.map(result => result.data),
    isPending: results.some(result => result.isPending),
    hasErrors: results.some(result => result.isError),
});
