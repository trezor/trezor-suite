import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { deviceAuthorizationInitialState } from '@suite-native/device-authorization';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { useWrappedNativeFlowAnalytics } from './useWrappedNativeFlowAnalytics';

const renderFlowAnalytics = async (
    props: Parameters<typeof useWrappedNativeFlowAnalytics>[0],
    isDeviceConnected = true,
) => {
    const services: NativeAnalyticsDep = {
        analytics: mockNativeAnalytics(jest.fn()),
    };

    const view = await renderHookWithStoreProvider(useWrappedNativeFlowAnalytics, {
        initialProps: props,
        services,
        preloadedState: {
            deviceAuthorization: deviceAuthorizationInitialState,
            device: { selectedDevice: { connected: isDeviceConnected } },
        },
    });

    return { ...view, analytics: services.analytics };
};

describe('useWrappedNativeFlowAnalytics', () => {
    it.each([
        { flowType: 'wrap', connected: true },
        { flowType: 'wrap', connected: false },
        { flowType: 'unwrap', connected: true },
        { flowType: 'unwrap', connected: false },
    ] as const)(
        'reports the connection state for $flowType (connected=$connected)',
        async ({ flowType, connected }) => {
            const { result, analytics } = await renderFlowAnalytics(
                { flowType, networkSymbol: asNetworkSymbol('eth') },
                connected,
            );

            await act(() => {
                result.current.reportSubmit();
            });

            expect(analytics.report).toHaveBeenCalledWith({
                type: `yield/${flowType}`,
                payload: {
                    type: 'submit',
                    action: 'continue',
                    networkSymbol: 'eth',
                    deviceStatus: connected ? 'connected' : 'disconnected',
                },
            });
        },
    );

    it('reports a cancelled simulation', async () => {
        const { result, analytics } = await renderFlowAnalytics({
            flowType: 'wrap',
            networkSymbol: asNetworkSymbol('eth'),
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
            networkSymbol: asNetworkSymbol('eth'),
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
            networkSymbol: asNetworkSymbol('eth'),
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
            networkSymbol: asNetworkSymbol('eth'),
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
