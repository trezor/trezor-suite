import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { PROTO } from '@trezor/connect';

import { TradingBaseCurrencyAmountPlaceholder } from './TradingBaseCurrencyAmountPlaceholder';

describe('TradingBaseCurrencyAmountPlaceholder', () => {
    const renderTradingBaseCurrencyAmountPlaceholder = (
        localCurrency: BaseCurrencyCode,
        bitcoinAmountUnit: PROTO.AmountUnit = PROTO.AmountUnit.BITCOIN,
    ) =>
        renderWithStoreProvider(<TradingBaseCurrencyAmountPlaceholder />, {
            preloadedState: { wallet: { settings: { localCurrency, bitcoinAmountUnit } } },
        });

    it('should render currency symbol and decimal placeholder', async () => {
        const { getByText } = await renderTradingBaseCurrencyAmountPlaceholder('usd');

        expect(getByText('$')).toBeOnTheScreen();
        expect(getByText('0.0')).toBeOnTheScreen();
    });

    it('should render sat label and integer placeholder when base currency is in sats', async () => {
        const { getByText } = await renderTradingBaseCurrencyAmountPlaceholder(
            'btc',
            PROTO.AmountUnit.SATOSHI,
        );

        expect(getByText('sat')).toBeOnTheScreen();
        expect(getByText('0')).toBeOnTheScreen();
    });
});
