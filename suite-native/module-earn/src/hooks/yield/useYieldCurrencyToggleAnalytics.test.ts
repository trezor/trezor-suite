import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { useYieldCurrencyToggleAnalytics } from './useYieldCurrencyToggleAnalytics';

const renderCurrencyToggleAnalytics = async (
    props: Parameters<typeof useYieldCurrencyToggleAnalytics>[0],
) => {
    const services: NativeAnalyticsDep = {
        analytics: mockNativeAnalytics(jest.fn()),
    };

    const view = await renderHookWithStoreProvider(useYieldCurrencyToggleAnalytics, {
        initialProps: props,
        services,
    });

    return { ...view, analytics: services.analytics };
};

describe('useYieldCurrencyToggleAnalytics', () => {
    it('reports both switches with the selected vault', async () => {
        const vaultId = 'vault-1';
        const { result, analytics } = await renderCurrencyToggleAnalytics({
            networkSymbol: asNetworkSymbol('eth'),
            vaultId,
        });

        await act(() => result.current('secondary'));
        await act(() => result.current('primary'));

        expect(jest.mocked(analytics.report).mock.calls.map(([event]) => event)).toEqual(
            ['fiat', 'crypto'].map(value => ({
                type: 'yield/interaction',
                payload: {
                    element: 'amount-currency-toggle',
                    value,
                    networkSymbol: 'eth',
                    vaultId,
                },
            })),
        );
    });
});
