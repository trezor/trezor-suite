import { type ReactNode, Suspense, lazy, useMemo } from 'react';

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';

const ReactQueryDevtools = lazy(async () => {
    const { ReactQueryDevtools } = await import('@tanstack/react-query-devtools');

    return { default: ReactQueryDevtools };
});

export interface ReactQueryProviderProps {
    children: ReactNode;
}

const IS_DEV = process.env.NODE_ENV === 'development';
const MAX_RETRY_COUNT = IS_DEV ? 0 : 3;
const DEV_TOOLS = IS_DEV;

export const ReactQueryProvider = ({ children }: ReactQueryProviderProps) => {
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
                    mutations: {},
                    queries: {
                        retry: failureCount => failureCount < MAX_RETRY_COUNT,
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
                    <ReactQueryDevtools />
                </Suspense>
            )}
        </QueryClientProvider>
    );
};
