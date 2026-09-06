import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { useYieldFlowAnalytics } from './useYieldFlowAnalytics';

const ethSymbol = asNetworkSymbol('eth');
const VAULT_ID = 'morpho-vault-id';

const renderFlowAnalytics = async (
    context: Parameters<typeof useYieldFlowAnalytics>[0] = {
        networkSymbol: ethSymbol,
        vaultId: VAULT_ID,
    },
) => {
    const services: NativeAnalyticsDep = {
        analytics: mockNativeAnalytics(jest.fn()),
    };

    const view = await renderHookWithStoreProvider(useYieldFlowAnalytics, {
        initialProps: context,
        services,
    });

    return { ...view, analytics: services.analytics };
};

describe('useYieldFlowAnalytics', () => {
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
