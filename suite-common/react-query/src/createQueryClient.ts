import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { isDevEnv } from './config';

/**
 * Fail fast during development, retry in production
 */
const MAX_RETRY_COUNT = isDevEnv ? 0 : 3;

export type CreateQueryClientParams = {
    shouldRefetchOnEvents: boolean;
};

export type QueryClientDep = {
    queryClient: QueryClient;
};

export const createQueryClient = ({
    shouldRefetchOnEvents,
}: CreateQueryClientParams): QueryClient =>
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
                refetchOnWindowFocus: shouldRefetchOnEvents,
                refetchOnMount: shouldRefetchOnEvents,
                refetchOnReconnect: shouldRefetchOnEvents,
            },
        },
    });

export const injectQueryClient = (services: any): QueryClientDep => ({
    queryClient: services.queryClient,
});
