import { type PropsWithChildren } from 'react';

import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';

type ReactNativeQueryProviderProps = PropsWithChildren<{
    client: QueryClient;
}>;

/**
 * React Query provider for React Native (@suite-native/app)
 * @url https://tanstack.com/query/v5/docs/framework/react/react-native
 */
export const ReactNativeQueryProvider = ({ client, children }: ReactNativeQueryProviderProps) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
);
