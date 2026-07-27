import { type PropsWithChildren, Suspense, lazy, useMemo } from 'react';

import {
    MutationCache,
    QueryCache,
    QueryClient,
    QueryClientProvider,
} from '@suite-common/react-query';
import { isDevEnv } from '@suite-common/suite-utils';

const Devtools = lazy(async () => {
    const { ReactQueryDevtools } = await import('@tanstack/react-query-devtools');

    return { default: ReactQueryDevtools };
});

/**
 * Fail fast during development, retry in production.
 */
const MAX_RETRY_COUNT = isDevEnv ? 0 : 3;

const isDevToolsEnabled = isDevEnv && process.env.TANSTACK_REACT_QUERY_DEV_TOOLS === 'true';

/**
 * React Query provider for Suite web and desktop applications.
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
            {isDevToolsEnabled && (
                <Suspense fallback={null}>
                    <Devtools />
                </Suspense>
            )}
        </QueryClientProvider>
    );
};
