import { type ReactNode, useState } from 'react';

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';

export interface ReactQueryProviderProps {
    children: ReactNode;
}

export const ReactQueryProvider = ({ children }: ReactQueryProviderProps) => {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                queryCache: new QueryCache({
                    onError(error, query) {
                        console.error(error, query);
                    },
                }),
                mutationCache: new MutationCache({
                    onError(error, variables, context) {
                        console.error(error, variables, context);
                    },
                }),
                // defaultOptions: {
                //     mutations: {
                //         gcTime: 0,
                //     },
                //     queries: {
                //         staleTime: 0,
                //         gcTime: 0,
                //         refetchOnWindowFocus: false,
                //         retry: failureCount => failureCount < 5,
                //     },
                // },
            }),
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {/* TODO: add dev tools when ready */}
        </QueryClientProvider>
    );
};
