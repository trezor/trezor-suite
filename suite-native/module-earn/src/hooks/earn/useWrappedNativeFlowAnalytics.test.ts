import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { useWrappedNativeFlowAnalytics } from './useWrappedNativeFlowAnalytics';

const renderFlowAnalytics = async (props: Parameters<typeof useWrappedNativeFlowAnalytics>[0]) => {
    const services: NativeAnalyticsDep = {
        analytics: mockNativeAnalytics(jest.fn()),
    };

    const view = await renderHookWithStoreProvider(useWrappedNativeFlowAnalytics, {
        initialProps: props,
        services,
    });

    return { ...view, analytics: services.analytics };
};

describe('useWrappedNativeFlowAnalytics', () => {
    it('reports submit as yield/wrap for the wrap flow', async () => {
        const { result, analytics } = await renderFlowAnalytics({
            flowType: 'wrap',
            networkSymbol: 'eth',
        });

        await act(() => {
            result.current.reportSubmit();
        });

        expect(analytics.report).toHaveBeenCalledWith({
            type: 'yield/wrap',
            payload: { type: 'submit', action: 'continue', networkSymbol: 'eth' },
        });
    });

    it('reports a cancelled simulation', async () => {
        const { result, analytics } = await renderFlowAnalytics({
            flowType: 'wrap',
            networkSymbol: 'eth',
        });

        await act(() => {
            result.current.reportSimulation('cancel');
        });

        expect(analytics.report).toHaveBeenCalledWith({
            type: 'yield/wrap',
            payload: { type: 'tx-simulation-modal', action: 'cancel', networkSymbol: 'eth' },
        });
    });

    it('reports sent', async () => {
        const { result, analytics } = await renderFlowAnalytics({
            flowType: 'wrap',
            networkSymbol: 'eth',
        });

        await act(() => {
            result.current.reportSent();
        });

        expect(analytics.report).toHaveBeenCalledWith({
            type: 'yield/wrap',
            payload: { type: 'sent', action: 'continue', networkSymbol: 'eth' },
        });
    });

    it('reports the given error message', async () => {
        const { result, analytics } = await renderFlowAnalytics({
            flowType: 'wrap',
            networkSymbol: 'eth',
        });

        await act(() => {
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

    it('reports max selected as yield/interaction with no vaultId', async () => {
        const { result, analytics } = await renderFlowAnalytics({
            flowType: 'wrap',
            networkSymbol: 'eth',
        });

        await act(() => {
            result.current.reportMaxSelected();
        });

        expect(analytics.report).toHaveBeenCalledWith({
            type: 'yield/interaction',
            payload: { element: 'wrap-max', networkSymbol: 'eth' },
        });
    });
});
