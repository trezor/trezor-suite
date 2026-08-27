import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { useWrappedNativeFlowResolutionAnalytics } from './useWrappedNativeFlowResolutionAnalytics';

const renderResolutionAnalytics = async (
    props: Parameters<typeof useWrappedNativeFlowResolutionAnalytics>[0],
) => {
    const services: NativeAnalyticsDep = {
        analytics: mockNativeAnalytics(jest.fn()),
    };

    const view = await renderHookWithStoreProvider(useWrappedNativeFlowResolutionAnalytics, {
        initialProps: props,
        services,
    });

    return { ...view, analytics: services.analytics };
};

const pendingWrap = {
    flowType: 'wrap',
    networkSymbol: 'eth',
    status: 'pending',
    txid: 'tx-1',
} as const satisfies Parameters<typeof useWrappedNativeFlowResolutionAnalytics>[0];

describe('useWrappedNativeFlowResolutionAnalytics', () => {
    it('reports success once when the status moves from pending to confirmed', async () => {
        const { rerender, analytics } = await renderResolutionAnalytics(pendingWrap);

        await act(async () => {
            await rerender({ ...pendingWrap, status: 'confirmed' });
        });

        expect(analytics.report).toHaveBeenCalledTimes(1);
        expect(analytics.report).toHaveBeenCalledWith({
            type: 'yield/wrap',
            payload: {
                type: 'success',
                action: 'continue',
                networkSymbol: 'eth',
                durationMs: expect.any(Number),
            },
        });
    });

    it('reports an on-chain-failure error when the status moves to failed', async () => {
        const pendingUnwrap = { ...pendingWrap, flowType: 'unwrap' } as const;
        const { rerender, analytics } = await renderResolutionAnalytics(pendingUnwrap);

        await act(async () => {
            await rerender({ ...pendingUnwrap, status: 'failed' });
        });

        expect(analytics.report).toHaveBeenCalledTimes(1);
        expect(analytics.report).toHaveBeenCalledWith({
            type: 'yield/unwrap',
            payload: {
                type: 'error',
                action: 'continue',
                networkSymbol: 'eth',
                durationMs: expect.any(Number),
                errorMessage: 'on-chain-failure',
            },
        });
    });

    it('reports the resolution only once when confirmed twice', async () => {
        const { rerender, analytics } = await renderResolutionAnalytics(pendingWrap);

        await act(async () => {
            await rerender({ ...pendingWrap, status: 'confirmed' });
        });

        await act(async () => {
            await rerender({ ...pendingWrap, status: 'confirmed' });
        });

        expect(analytics.report).toHaveBeenCalledTimes(1);
    });

    it('reports leftPending on unmount while the transaction is still pending', async () => {
        const { unmount, analytics } = await renderResolutionAnalytics(pendingWrap);

        await act(async () => {
            await unmount();
        });

        expect(analytics.report).toHaveBeenCalledWith({
            type: 'yield/wrap',
            payload: {
                type: 'leftPending',
                action: 'continue',
                networkSymbol: 'eth',
                durationMs: expect.any(Number),
            },
        });
    });

    it('does not report leftPending on unmount once the transaction already resolved', async () => {
        const { rerender, unmount, analytics } = await renderResolutionAnalytics(pendingWrap);

        await act(async () => {
            await rerender({ ...pendingWrap, status: 'confirmed' });
        });

        expect(analytics.report).toHaveBeenCalledTimes(1);

        await act(async () => {
            await unmount();
        });

        expect(analytics.report).toHaveBeenCalledTimes(1);
    });

    it('resets the resolution guard when the txid changes', async () => {
        const { rerender, analytics } = await renderResolutionAnalytics(pendingWrap);

        await act(async () => {
            await rerender({ ...pendingWrap, status: 'confirmed' });
        });

        expect(analytics.report).toHaveBeenCalledTimes(1);

        await act(async () => {
            await rerender({ ...pendingWrap, status: 'pending', txid: 'tx-2' });
        });

        await act(async () => {
            await rerender({ ...pendingWrap, status: 'confirmed', txid: 'tx-2' });
        });

        expect(analytics.report).toHaveBeenCalledTimes(2);
    });
});
