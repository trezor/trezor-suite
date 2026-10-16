import { cleanup, waitFor } from '@suite-common/test-utils';
import { fiatRatesApi, initialWalletSettingsState } from '@suite-common/wallet-core';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import {
    calculatePreferredCurrencyUsdThreshold,
    usePreferredCurrencyUsdThreshold,
} from './usePreferredCurrencyUsdThreshold';
import {
    createTestStateWithWalletSettings,
    renderHookWithTradingStore,
} from '../test-utils/testUtils';

const renderUsePreferredCurrencyUsdThreshold = (localCurrency: BaseCurrencyCode) =>
    renderHookWithTradingStore(() => usePreferredCurrencyUsdThreshold(), {
        preloadedState: createTestStateWithWalletSettings({
            settings: { ...initialWalletSettingsState, localCurrency },
        }),
    });

describe('calculatePreferredCurrencyUsdThreshold', () => {
    it('returns 0.1 for USD without rates', () => {
        expect(
            calculatePreferredCurrencyUsdThreshold({
                baseCurrency: 'usd',
                btcUsdRate: undefined,
                btcBaseCurrencyRate: undefined,
            })?.toString(),
        ).toBe('0.1');
    });

    it('calculates the threshold through BTC cross-rates', () => {
        expect(
            calculatePreferredCurrencyUsdThreshold({
                baseCurrency: 'czk',
                btcUsdRate: 50_000,
                btcBaseCurrencyRate: 1_100_000,
            })?.toString(),
        ).toBe('2.2');
    });

    it('returns null until required rates are available', () => {
        expect(
            calculatePreferredCurrencyUsdThreshold({
                baseCurrency: 'eur',
                btcUsdRate: 50_000,
                btcBaseCurrencyRate: undefined,
            }),
        ).toBeNull();
    });
});

describe('usePreferredCurrencyUsdThreshold', () => {
    let services: ReturnType<typeof renderUsePreferredCurrencyUsdThreshold>['services'];

    afterEach(() => {
        // Unmount first, so that mounted hooks do not refetch the reset cache.
        cleanup();
        services.store.dispatch(fiatRatesApi.util.resetApiState());
    });

    it('subscribes to the BTC rates in USD and in the base currency', async () => {
        ({ services } = renderUsePreferredCurrencyUsdThreshold('czk'));

        await waitFor(() =>
            expect(Object.keys(services.store.getState().fiatRatesApi.queries).sort()).toEqual([
                'getCurrentFiatRate(btc-czk)',
                'getCurrentFiatRate(btc-usd)',
            ]),
        );
    });

    it('returns the USD threshold without subscribing to any rate', () => {
        const rendered = renderUsePreferredCurrencyUsdThreshold('usd');
        ({ services } = rendered);

        expect(rendered.result.current?.toString()).toBe('0.1');
        expect(services.store.getState().fiatRatesApi.queries).toEqual({});
    });
});
