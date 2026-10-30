import { type PropsWithChildren, Suspense, lazy } from 'react';

import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { isDevEnv } from '../src/config';

const Devtools = lazy(async () => {
    const { ReactQueryDevtools } = await import('@tanstack/react-query-devtools');

    return { default: ReactQueryDevtools };
});

const DEV_TOOLS = isDevEnv && process.env.TANSTACK_REACT_QUERY_DEV_TOOLS === 'true';

type ReactQueryProviderProps = PropsWithChildren<{
    client: QueryClient;
}>;

/**
 * React Query provider for web (desktop) (@trezor/suite)
 */
export const ReactQueryProvider = ({ client, children }: ReactQueryProviderProps) => (
    <QueryClientProvider client={client}>
        {children}
        {DEV_TOOLS && (
            <Suspense fallback={null}>
                <Devtools />
            </Suspense>
        )}
    </QueryClientProvider>
);
