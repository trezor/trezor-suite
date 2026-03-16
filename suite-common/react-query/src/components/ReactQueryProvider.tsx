import { type PropsWithChildren, Suspense, lazy, useMemo } from 'react';

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { isDevEnv } from '../config';

const Devtools = lazy(async () => {
    const { ReactQueryDevtools } = await import('@tanstack/react-query-devtools');

    return { default: ReactQueryDevtools };
});

/**
 * Fail fast during development, retry in production
 */
const MAX_RETRY_COUNT = isDevEnv ? 0 : 3;

const DEV_TOOLS = isDevEnv && process.env.TANSTACK_REACT_QUERY_DEV_TOOLS === 'true';

/**
 * React Query provider for web (desktop) (@trezor/suite)
 */
export const ReactQueryProvider = ({ children }: PropsWithChildren) => {
    const queryClient = useMemo(
        () =>
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
                        refetchOnWindowFocus: true,
                        refetchOnMount: true,
                        refetchOnReconnect: true,
                    },
                },
            }),
        [],
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {DEV_TOOLS && (
                <Suspense fallback={null}>
                    <Devtools />
                </Suspense>
            )}
        </QueryClientProvider>
    );
};
