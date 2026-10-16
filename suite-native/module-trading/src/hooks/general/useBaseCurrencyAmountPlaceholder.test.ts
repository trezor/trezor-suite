import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { PROTO } from '@trezor/connect';

import { useBaseCurrencyAmountPlaceholder } from './useBaseCurrencyAmountPlaceholder';

describe('useBaseCurrencyAmountPlaceholder', () => {
    const renderUseBaseCurrencyAmountPlaceholder = (
        localCurrency: BaseCurrencyCode,
        bitcoinAmountUnit: PROTO.AmountUnit = PROTO.AmountUnit.BITCOIN,
    ) =>
        renderHookWithStoreProvider(() => useBaseCurrencyAmountPlaceholder(), {
            preloadedState: { wallet: { settings: { localCurrency, bitcoinAmountUnit } } },
        });

    it.each<[BaseCurrencyCode, string]>([
        ['usd', '$'],
        ['eur', '€'],
    ])(
        'should return %s currency symbol with decimal placeholder',
        async (localCurrency, expectedLabel) => {
            const { result } = await renderUseBaseCurrencyAmountPlaceholder(localCurrency);

            expect(result.current).toEqual({
                baseCurrencyLabel: expectedLabel,
                baseCurrencyDecimals: 2,
                placeholder: '0.0',
            });
        },
    );

    it('should return sat label with integer placeholder when base currency is in sats', async () => {
        const { result } = await renderUseBaseCurrencyAmountPlaceholder(
            'btc',
            PROTO.AmountUnit.SATOSHI,
        );

        expect(result.current).toEqual({
            baseCurrencyLabel: 'sat',
            baseCurrencyDecimals: 0,
            placeholder: '0',
        });
    });

    it('should return network decimals with decimal placeholder when base currency is btc', async () => {
        const { result } = await renderUseBaseCurrencyAmountPlaceholder('btc');

        expect(result.current.baseCurrencyDecimals).toBe(8);
        expect(result.current.placeholder).toBe('0.0');
    });
});
