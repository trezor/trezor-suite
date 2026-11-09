import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { deviceAuthorizationInitialState } from '@suite-native/device-authorization';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { useYieldFlowAnalytics, useYieldFormExitAnalytics } from './useYieldFlowAnalytics';

type RemoveEvent = { data: { action: { type: string } } };
const mockNavigation = {
    addListener: jest.fn(
        (_name: string, _listener: (event: RemoveEvent) => void) => () => undefined,
    ),
    isFocused: () => true,
};
jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => mockNavigation,
    useFocusEffect: jest.fn(),
}));

const ethSymbol = asNetworkSymbol('eth');
const VAULT_ID = 'morpho-vault-id';

const renderFlowAnalytics = async (
    context: Parameters<typeof useYieldFlowAnalytics>[0] = {
        networkSymbol: ethSymbol,
        vaultId: VAULT_ID,
    },
    isDeviceConnected = true,
) => {
    const services: NativeAnalyticsDep = {
        analytics: mockNativeAnalytics(jest.fn()),
    };

    const view = await renderHookWithStoreProvider(useYieldFlowAnalytics, {
        initialProps: context,
        services,
        preloadedState: {
            deviceAuthorization: deviceAuthorizationInitialState,
            device: { selectedDevice: { connected: isDeviceConnected } },
        },
    });

    return { ...view, analytics: services.analytics };
};

describe('useYieldFlowAnalytics', () => {
    it.each([true, false])(
        'reports the connection state at submit (connected=%s)',
        async connected => {
            const { result, analytics } = await renderFlowAnalytics(undefined, connected);

            await act(() => {
                result.current.reportDeposit({ action: 'continue', type: 'approve' });
                result.current.reportWithdraw({ action: 'continue', type: 'withdraw' });
            });

            expect(analytics.report).toHaveBeenCalledTimes(2);
            for (const [event] of jest.mocked(analytics.report).mock.calls) {
                expect(event).toMatchObject({
                    payload: { deviceStatus: connected ? 'connected' : 'disconnected' },
                });
            }
        },
    );

    it('reports an interaction with the bound flow context', async () => {
        const { result, analytics } = await renderFlowAnalytics();

        await act(() => {
            result.current.reportInteraction({ element: 'deposit-max' });
        });

        expect(analytics.report).toHaveBeenCalledWith({
            type: 'yield/interaction',
            payload: { element: 'deposit-max', networkSymbol: ethSymbol, vaultId: VAULT_ID },
        });
    });

    it('reports a deposit event including extra payload fields', async () => {
        const { result, analytics } = await renderFlowAnalytics();

        await act(() => {
            result.current.reportDeposit({
                action: 'continue',
                type: 'deposit',
                wrappedNative: true,
            });
        });

        expect(analytics.report).toHaveBeenCalledWith({
            type: 'yield/deposit',
            payload: {
                action: 'continue',
                type: 'deposit',
                wrappedNative: true,
                networkSymbol: ethSymbol,
                vaultId: VAULT_ID,
                deviceStatus: 'connected',
            },
        });
    });

    it('reports a withdraw event with the operation', async () => {
        const { result, analytics } = await renderFlowAnalytics();

        await act(() => {
            result.current.reportWithdraw({
                action: 'cancel',
                type: 'unwrap',
                operation: 'redeem',
            });
        });

        expect(analytics.report).toHaveBeenCalledWith({
            type: 'yield/withdraw',
            payload: {
                action: 'cancel',
                type: 'unwrap',
                operation: 'redeem',
                networkSymbol: ethSymbol,
                vaultId: VAULT_ID,
            },
        });
    });

    it('rebinds the context after a rerender', async () => {
        const { result, analytics, rerender } = await renderFlowAnalytics({
            networkSymbol: undefined,
            vaultId: undefined,
        });

        await act(() => rerender({ networkSymbol: ethSymbol, vaultId: VAULT_ID }));

        await act(() => {
            result.current.reportInteraction({ element: 'withdraw-max', value: 'asset' });
        });

        expect(analytics.report).toHaveBeenCalledWith({
            type: 'yield/interaction',
            payload: {
                element: 'withdraw-max',
                value: 'asset',
                networkSymbol: ethSymbol,
                vaultId: VAULT_ID,
            },
        });
    });
});

describe('Yield multi-step form exits', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockNavigation.addListener.mockReturnValue(() => undefined);
    });

    it.each(['deposit', 'withdraw', 'redeem'] as const)(
        'reports an unfinished %s flow exit, but excludes unresolved steps',
        async flowType => {
            const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };
            const props = {
                flowType,
                networkSymbol: asNetworkSymbol('eth'),
                vaultId: 'public-vault',
                isEnabled: true,
            };
            const { rerender } = await renderHookWithStoreProvider(useYieldFormExitAnalytics, {
                initialProps: props,
                services,
            });
            const remove = async () => {
                const listener = mockNavigation.addListener.mock.calls.at(-1)?.[1];
                if (!listener) throw new Error('Missing removal listener');
                await act(() => listener({ data: { action: { type: 'POP_TO_TOP' } } }));
            };
            await remove();
            await rerender({ ...props, isEnabled: false });
            await remove();

            const form = flowType === 'deposit' ? 'deposit-form' : 'withdraw-form';
            expect(
                jest.mocked(services.analytics.report).mock.calls.map(([event]) => event),
            ).toEqual([
                {
                    type: 'yield/navigate',
                    payload: {
                        action: 'cancel',
                        from: form,
                        to: 'earn-dashboard',
                        networkSymbol: 'eth',
                        vaultId: 'public-vault',
                    },
                },
            ]);
        },
    );
});
