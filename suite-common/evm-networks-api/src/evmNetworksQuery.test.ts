/**
 * @jest-environment jsdom
 */
import { createQueryClient } from '@suite-common/react-query';
import { act, renderHookWithQueryClient, waitFor } from '@suite-common/test-utils';

import { getEvmNetworksFixture } from './evmNetworksFixture';
import { evmNetworksQueryOptions, useEvmNetworksQuery } from './evmNetworksQuery';

type TestQueryClient = ReturnType<typeof createQueryClient>;

const getQueryState = (queryClient: TestQueryClient) =>
    queryClient.getQueryState(evmNetworksQueryOptions.queryKey);

// What the desktop app does after the startup prefetch: open the picker, then focus the window
// and come back online.
const mountAndRefocus = async (queryClient: TestQueryClient) => {
    const { result } = renderHookWithQueryClient(() => useEvmNetworksQuery(), { queryClient });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    act(() => {
        window.dispatchEvent(new Event('visibilitychange'));
        window.dispatchEvent(new Event('online'));
    });

    return result;
};

describe(useEvmNetworksQuery.name, () => {
    it('does not query again after the startup prefetch succeeded', async () => {
        const queryClient = createQueryClient({ shouldRefetchOnEvents: true });

        await queryClient.prefetchQuery(evmNetworksQueryOptions);
        const result = await mountAndRefocus(queryClient);

        expect(result.current.isSuccess).toBe(true);
        expect(getQueryState(queryClient)?.dataUpdateCount).toBe(1);
    });

    it('does not query again after the startup prefetch failed', async () => {
        const failingQueryFn = jest.fn(() => Promise.reject(new Error('unavailable')));
        const queryClient = createQueryClient({ shouldRefetchOnEvents: true });

        await queryClient.prefetchQuery({
            ...evmNetworksQueryOptions,
            queryFn: failingQueryFn,
            retry: false,
        });
        const result = await mountAndRefocus(queryClient);

        expect(result.current.isError).toBe(true);
        expect(failingQueryFn).toHaveBeenCalledTimes(1);
        expect(getQueryState(queryClient)?.dataUpdateCount).toBe(0);
    });

    it('answers from the fixture on mount when nothing was prefetched', async () => {
        const queryClient = createQueryClient({ shouldRefetchOnEvents: true });

        const result = await mountAndRefocus(queryClient);

        expect(result.current.data).toEqual(getEvmNetworksFixture());
        expect(getQueryState(queryClient)?.dataUpdateCount).toBe(1);
    });
});
