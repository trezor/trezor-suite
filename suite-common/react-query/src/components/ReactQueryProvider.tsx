import { type PropsWithChildren, type ReactNode, useMemo } from 'react';

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { isDevEnv } from '@suite-common/suite-utils';

/**
 * Fail fast during development, retry in production
 */
const MAX_RETRY_COUNT = isDevEnv ? 0 : 3;

type ReactQueryProviderProps = PropsWithChildren<{
    refetchOnWindowFocus?: boolean;
    refetchOnMount?: boolean;
    refetchOnReconnect?: boolean;
    devtools?: ReactNode;
}>;

export const ReactQueryProvider = ({
    children,
    refetchOnWindowFocus = false,
    refetchOnMount = false,
    refetchOnReconnect = false,
    devtools,
}: ReactQueryProviderProps) => {
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
                        refetchOnWindowFocus,
                        refetchOnMount,
                        refetchOnReconnect,
                    },
                },
            }),
        [refetchOnWindowFocus, refetchOnMount, refetchOnReconnect],
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {devtools}
        </QueryClientProvider>
    );
};
