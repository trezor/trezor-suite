import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { renderWithStoreProvider, screen } from '@suite-native/test-utils-store';
import { BigNumber } from '@trezor/utils';

import { BaseCurrencyAmountHeaderFormatter } from './BaseCurrencyAmountHeaderFormatter';

const renderHeader = (value: string, localCurrency: string) =>
    renderWithStoreProvider(
        <BaseCurrencyAmountHeaderFormatter
            value={asBaseCurrencyAmount(new BigNumber(value))}
            isExact
        />,
        { preloadedState: { wallet: { settings: { localCurrency } } } },
    );

describe('BaseCurrencyAmountHeaderFormatter', () => {
    it('reads a long fiat price in order, as one text', async () => {
        await renderHeader('0.0000001234567890123456', 'usd');

        expect(screen.getByText('$0.0000001234567890123456')).toBeTruthy();
    });

    it('puts a crypto unit after its amount', async () => {
        await renderHeader('1.5', 'btc');

        expect(screen.getByText('1.50 BTC')).toBeTruthy();
    });
});
