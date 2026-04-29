import { type ReactNode } from 'react';

import { type RenderHookOptions, renderHook } from '@testing-library/react';

import { QueryClient, QueryClientProvider } from '@suite-common/react-query';

// retry:false so failing-query tests don't pay for the production retry policy.
// gcTime:0 keeps tests independent — nothing leaks between renderHook calls.
export const newTestQueryClient = () =>
    new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });

type Options<Props> = RenderHookOptions<Props> & { queryClient?: QueryClient };

export const renderHookWithQueryClient = <Result, Props>(
    callback: (props: Props) => Result,
    { wrapper: Wrapper, queryClient = newTestQueryClient(), ...options }: Options<Props> = {},
) =>
    renderHook(callback, {
        wrapper: ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>
                {Wrapper ? <Wrapper>{children}</Wrapper> : children}
            </QueryClientProvider>
        ),
        ...options,
    });
