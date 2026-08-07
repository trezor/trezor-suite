import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import {
    useWrappedNativeFlowAnalytics,
    useWrappedNativeFlowResolutionAnalytics,
} from './useWrappedNativeFlowAnalytics';

const renderUseWrappedNativeFlowAnalytics = (
    props: Parameters<typeof useWrappedNativeFlowAnalytics>[0],
) => {
    const services: NativeAnalyticsDep = {
        analytics: mockNativeAnalytics(jest.fn()),
    };

    const view = renderHookWithStoreProvider(useWrappedNativeFlowAnalytics, {
        initialProps: props,
        services,
    });

    return { ...view, analytics: services.analytics };
};

const renderUseWrappedNativeFlowResolutionAnalytics = (
    props: Parameters<typeof useWrappedNativeFlowResolutionAnalytics>[0],
) => {
    const services: NativeAnalyticsDep = {
        analytics: mockNativeAnalytics(jest.fn()),
    };

    const view = renderHookWithStoreProvider(useWrappedNativeFlowResolutionAnalytics, {
        initialProps: props,
        services,
    });

    return { ...view, analytics: services.analytics };
};

describe('useWrappedNativeFlowAnalytics', () => {
    it('reports submit as yield/wrap for the wrap flow', () => {
        const { result, analytics } = renderUseWrappedNativeFlowAnalytics({
            flowType: 'wrap',
            networkSymbol: 'eth',
        });

        act(() => {
            result.current.reportSubmit();
        });

        expect(analytics.report).toHaveBeenCalledWith({
            type: 'yield/wrap',
            payload: { type: 'submit', action: 'continue', networkSymbol: 'eth' },
        });
    });

    it('reports submit as yield/unwrap for the unwrap flow', () => {
        const { result, analytics } = renderUseWrappedNativeFlowAnalytics({
            flowType: 'unwrap',
            networkSymbol: 'eth',
        });

        act(() => {
            result.current.reportSubmit();
        });

        expect(analytics.report).toHaveBeenCalledWith({
            type: 'yield/unwrap',
            payload: { type: 'submit', action: 'continue', networkSymbol: 'eth' },
        });
    });

    it('reports a cancelled simulation', () => {
        const { result, analytics } = renderUseWrappedNativeFlowAnalytics({
            flowType: 'wrap',
            networkSymbol: 'eth',
        });

        act(() => {
            result.current.reportSimulation('cancel');
        });

        expect(analytics.report).toHaveBeenCalledWith({
            type: 'yield/wrap',
            payload: { type: 'tx-simulation-modal', action: 'cancel', networkSymbol: 'eth' },
        });
    });

    it('reports sent', () => {
        const { result, analytics } = renderUseWrappedNativeFlowAnalytics({
            flowType: 'wrap',
            networkSymbol: 'eth',
        });

        act(() => {
            result.current.reportSent();
        });

        expect(analytics.report).toHaveBeenCalledWith({
            type: 'yield/wrap',
            payload: { type: 'sent', action: 'continue', networkSymbol: 'eth' },
        });
    });

    it('reports the given error message', () => {
        const { result, analytics } = renderUseWrappedNativeFlowAnalytics({
            flowType: 'wrap',
            networkSymbol: 'eth',
        });

        act(() => {
            result.current.reportError('push-failed');
        });

        expect(analytics.report).toHaveBeenCalledWith({
            type: 'yield/wrap',
            payload: {
                type: 'error',
                action: 'continue',
                networkSymbol: 'eth',
                errorMessage: 'push-failed',
            },
        });
    });

    it('reports max selected as yield/interaction with no vaultId', () => {
        const { result, analytics } = renderUseWrappedNativeFlowAnalytics({
            flowType: 'wrap',
            networkSymbol: 'eth',
        });

        act(() => {
            result.current.reportMaxSelected();
        });

        expect(analytics.report).toHaveBeenCalledWith({
            type: 'yield/interaction',
            payload: { element: 'wrap-max', networkSymbol: 'eth' },
        });
    });
});

describe('useWrappedNativeFlowResolutionAnalytics', () => {
    it('reports success once when the status moves from pending to confirmed', () => {
        const { rerender, analytics } = renderUseWrappedNativeFlowResolutionAnalytics({
            flowType: 'wrap',
            networkSymbol: 'eth',
            status: 'pending',
            txid: 'tx-1',
        });

        act(() => {
            rerender({
                flowType: 'wrap',
                networkSymbol: 'eth',
                status: 'confirmed',
                txid: 'tx-1',
            });
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

    it('reports an on-chain-failure error when the status moves to failed', () => {
        const { rerender, analytics } = renderUseWrappedNativeFlowResolutionAnalytics({
            flowType: 'unwrap',
            networkSymbol: 'eth',
            status: 'pending',
            txid: 'tx-1',
        });

        act(() => {
            rerender({
                flowType: 'unwrap',
                networkSymbol: 'eth',
                status: 'failed',
                txid: 'tx-1',
            });
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

    it('reports the resolution only once when confirmed twice', () => {
        const { rerender, analytics } = renderUseWrappedNativeFlowResolutionAnalytics({
            flowType: 'wrap',
            networkSymbol: 'eth',
            status: 'pending',
            txid: 'tx-1',
        });

        act(() => {
            rerender({
                flowType: 'wrap',
                networkSymbol: 'eth',
                status: 'confirmed',
                txid: 'tx-1',
            });
        });

        act(() => {
            rerender({
                flowType: 'wrap',
                networkSymbol: 'eth',
                status: 'confirmed',
                txid: 'tx-1',
            });
        });

        expect(analytics.report).toHaveBeenCalledTimes(1);
    });

    it('reports leftPending on unmount while the transaction is still pending', () => {
        const { unmount, analytics } = renderUseWrappedNativeFlowResolutionAnalytics({
            flowType: 'wrap',
            networkSymbol: 'eth',
            status: 'pending',
            txid: 'tx-1',
        });

        act(() => {
            unmount();
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

    it('does not report leftPending on unmount once the transaction already resolved', () => {
        const { rerender, unmount, analytics } = renderUseWrappedNativeFlowResolutionAnalytics({
            flowType: 'wrap',
            networkSymbol: 'eth',
            status: 'pending',
            txid: 'tx-1',
        });

        act(() => {
            rerender({
                flowType: 'wrap',
                networkSymbol: 'eth',
                status: 'confirmed',
                txid: 'tx-1',
            });
        });

        expect(analytics.report).toHaveBeenCalledTimes(1);

        act(() => {
            unmount();
        });

        expect(analytics.report).toHaveBeenCalledTimes(1);
    });

    it('resets the resolution guard when the txid changes', () => {
        const { rerender, analytics } = renderUseWrappedNativeFlowResolutionAnalytics({
            flowType: 'wrap',
            networkSymbol: 'eth',
            status: 'pending',
            txid: 'tx-1',
        });

        act(() => {
            rerender({
                flowType: 'wrap',
                networkSymbol: 'eth',
                status: 'confirmed',
                txid: 'tx-1',
            });
        });

        expect(analytics.report).toHaveBeenCalledTimes(1);

        act(() => {
            rerender({
                flowType: 'wrap',
                networkSymbol: 'eth',
                status: 'pending',
                txid: 'tx-2',
            });
        });

        act(() => {
            rerender({
                flowType: 'wrap',
                networkSymbol: 'eth',
                status: 'confirmed',
                txid: 'tx-2',
            });
        });

        expect(analytics.report).toHaveBeenCalledTimes(2);
    });
});
