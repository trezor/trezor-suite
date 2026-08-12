import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { useYieldCurrencyToggleAnalytics } from './useYieldCurrencyToggleAnalytics';

const renderCurrencyToggleAnalytics = (
    props: Parameters<typeof useYieldCurrencyToggleAnalytics>[0],
) => {
    const services: NativeAnalyticsDep = {
        analytics: mockNativeAnalytics(jest.fn()),
    };

    const view = renderHookWithStoreProvider(useYieldCurrencyToggleAnalytics, {
        initialProps: props,
        services,
    });

    return { ...view, analytics: services.analytics };
};

describe('useYieldCurrencyToggleAnalytics', () => {
    it('reports a switch to the fiat input', () => {
        const { result, analytics } = renderCurrencyToggleAnalytics({
            networkSymbol: 'eth',
            vaultId: 'vault-1',
        });

        act(() => {
            result.current('secondary');
        });

        expect(analytics.report).toHaveBeenCalledWith({
            type: 'yield/interaction',
            payload: {
                element: 'amount-currency-toggle',
                value: 'fiat',
                networkSymbol: 'eth',
                vaultId: 'vault-1',
            },
        });
    });

    it('reports a switch back to the crypto input', () => {
        const { result, analytics } = renderCurrencyToggleAnalytics({
            networkSymbol: 'eth',
            vaultId: 'vault-1',
        });

        act(() => {
            result.current('primary');
        });

        expect(analytics.report).toHaveBeenCalledWith({
            type: 'yield/interaction',
            payload: {
                element: 'amount-currency-toggle',
                value: 'crypto',
                networkSymbol: 'eth',
                vaultId: 'vault-1',
            },
        });
    });

    it('omits vaultId for the standalone wrap/unwrap forms', () => {
        const { result, analytics } = renderCurrencyToggleAnalytics({ networkSymbol: 'eth' });

        act(() => {
            result.current('secondary');
        });

        expect(analytics.report).toHaveBeenCalledWith({
            type: 'yield/interaction',
            payload: {
                element: 'amount-currency-toggle',
                value: 'fiat',
                networkSymbol: 'eth',
                vaultId: undefined,
            },
        });
    });

    it('reports every switch, so a toggle back and forth is counted twice', () => {
        const { result, analytics } = renderCurrencyToggleAnalytics({ networkSymbol: 'eth' });

        act(() => {
            result.current('secondary');
            result.current('primary');
        });

        expect(analytics.report).toHaveBeenCalledTimes(2);
    });
});
