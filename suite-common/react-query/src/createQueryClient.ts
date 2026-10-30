import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { isDevEnv } from './config';

/**
 * Fail fast during development, retry in production
 */
const MAX_RETRY_COUNT = isDevEnv ? 0 : 3;

export type CreateQueryClientParams = {
    /** Refetch stale queries on window focus, mount and reconnect. */
    shouldRefetchOnEvents: boolean;
};

export type QueryClientDep = {
    queryClient: QueryClient;
};

/**
 * The one query client of an app. The composition root creates it, so thunks share their cache
 * with the components that render it.
 */
export const createQueryClient = (params: CreateQueryClientParams): QueryClient =>
    new QueryClient({
        queryCache: new QueryCache({
            onError: error => {
                console.error(error);
            },
        }),
        mutationCache: new MutationCache({
            onError: error => {
                console.error(error);
            },
        }),
        defaultOptions: {
            mutations: {
                retry: failureCount => failureCount < MAX_RETRY_COUNT,
            },
            queries: {
                retry: failureCount => failureCount < MAX_RETRY_COUNT,
                refetchOnWindowFocus: params.shouldRefetchOnEvents,
                refetchOnMount: params.shouldRefetchOnEvents,
                refetchOnReconnect: params.shouldRefetchOnEvents,
            },
        },
    });

export const injectQueryClient = (services: any): QueryClientDep => ({
    queryClient: services.queryClient,
});
