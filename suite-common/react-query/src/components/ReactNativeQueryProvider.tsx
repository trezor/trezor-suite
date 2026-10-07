import { type PropsWithChildren, useMemo } from 'react';

import { QueryClientProvider } from '@tanstack/react-query';

import { createQueryClient } from '../createQueryClient';

/**
 * React Query provider for React Native (@suite-native/app)
 * @url https://tanstack.com/query/v5/docs/framework/react/react-native
 */
export const ReactNativeQueryProvider = ({ children }: PropsWithChildren) => {
    const queryClient = useMemo(() => createQueryClient('native'), []);

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
