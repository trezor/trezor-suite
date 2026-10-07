import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { isDevEnv } from './config';

/**
 * Fail fast during development, retry in production
 */
const MAX_RETRY_COUNT = isDevEnv ? 0 : 3;

export type QueryClientPlatform = 'web' | 'native';

/** `meta` of a query whose key or error may hold account data, such as a descriptor. */
export const CONFIDENTIAL_QUERY_META = { isConfidential: true } as const;

const isConfidential = (meta: Record<string, unknown> | undefined) => meta?.isConfidential === true;

/**
 * Console errors are reported to Sentry and console output is kept as breadcrumbs, so a failed
 * confidential query logs only the error's name: never its message, key or payload.
 */
const logError = (error: Error, meta: Record<string, unknown> | undefined) => {
    if (isConfidential(meta)) {
        console.warn(`Confidential query failed: ${error.name}`);

        return;
    }

    console.error(error);
};

export const createQueryClient = (platform: QueryClientPlatform) => {
    const refetchOnEvents = platform === 'web';

    return new QueryClient({
        queryCache: new QueryCache({
            onError: (error, query) => logError(error, query.meta),
        }),
        mutationCache: new MutationCache({
            onError: (error, _variables, _onMutateResult, mutation) =>
                logError(error, mutation.meta),
        }),
        defaultOptions: {
            mutations: {
                retry: failureCount => failureCount < MAX_RETRY_COUNT,
            },
            queries: {
                retry: failureCount => failureCount < MAX_RETRY_COUNT,
                refetchOnWindowFocus: refetchOnEvents,
                refetchOnMount: refetchOnEvents,
                refetchOnReconnect: refetchOnEvents,
            },
        },
    });
};
