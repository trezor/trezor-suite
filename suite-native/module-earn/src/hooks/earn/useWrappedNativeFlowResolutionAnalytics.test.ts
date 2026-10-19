import { asNetworkSymbol } from '@suite-common/wallet-config';
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
    networkSymbol: asNetworkSymbol('eth'),
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

    it.each(['wrap', 'unwrap'] as const)(
        'reports a new %s transaction even if its resolved status is unchanged',
        async flowType => {
            const props = { ...pendingWrap, flowType, status: 'confirmed' as const };
            const { rerender, analytics } = await renderResolutionAnalytics(props);

            await rerender({ ...props, txid: 'tx-2' });

            expect(analytics.report).toHaveBeenCalledTimes(2);
            expect(analytics.report).toHaveBeenLastCalledWith({
                type: `yield/${flowType}`,
                payload: expect.objectContaining({ type: 'success' }),
            });
        },
    );

    it.each(['wrap', 'unwrap'] as const)(
        'does not report a %s resolution without a broadcast transaction',
        async flowType => {
            const { analytics, unmount } = await renderResolutionAnalytics({
                ...pendingWrap,
                flowType,
                status: 'confirmed',
                txid: null,
            });

            await unmount();

            expect(analytics.report).not.toHaveBeenCalled();
        },
    );

    it.each(['wrap', 'unwrap'] as const)(
        'measures %s resolution from broadcast when the pending flow is reopened',
        async flowType => {
            const submittedAt = Date.now() - 60_000;
            const { analytics } = await renderResolutionAnalytics({
                ...pendingWrap,
                flowType,
                status: 'confirmed',
                submittedAt,
            });
            const event = jest.mocked(analytics.report).mock.calls[0]?.[0];

            expect(event).toEqual({
                type: `yield/${flowType}`,
                payload: {
                    type: 'success',
                    action: 'continue',
                    networkSymbol: 'eth',
                    durationMs: expect.any(Number),
                },
            });
            expect(
                event &&
                    'payload' in event &&
                    'durationMs' in event.payload &&
                    event.payload.durationMs,
            ).toBeGreaterThanOrEqual(60_000);
        },
    );
});
