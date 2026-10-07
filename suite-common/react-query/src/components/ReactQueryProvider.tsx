import { type PropsWithChildren, Suspense, lazy, useMemo } from 'react';

import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { isDevEnv } from '../config';
import { createQueryClient } from '../createQueryClient';

const Devtools = lazy(async () => {
    const { ReactQueryDevtools } = await import('@tanstack/react-query-devtools');

    return { default: ReactQueryDevtools };
});

const DEV_TOOLS = isDevEnv && process.env.TANSTACK_REACT_QUERY_DEV_TOOLS === 'true';

type ReactQueryProviderProps = PropsWithChildren<{
    /** A client created by the composition root, so services outside React can reach the cache. */
    client?: QueryClient;
}>;

/**
 * React Query provider for web (desktop) (@trezor/suite)
 */
export const ReactQueryProvider = ({ children, client }: ReactQueryProviderProps) => {
    const queryClient = useMemo(() => client ?? createQueryClient('web'), [client]);

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
