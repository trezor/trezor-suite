import { renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { getWalletState } from '../../../../__fixtures__/walletState';
import { SellFiatCurrencySheet } from '../SellFiatCurrencySheet';

describe('SellFiatCurrencySheet', () => {
    const renderSellFiatCurrencySheet = () =>
        renderWithStoreProviderAsync(
            <SellFiatCurrencySheet onFiatSelect={jest.fn()} onClose={jest.fn()} isVisible={true} />,
            { preloadedState: { wallet: getWalletState({ tradeType: 'sell' }) } },
        );

    it('should render items based on Sell state', async () => {
        const { getByText } = await renderSellFiatCurrencySheet();

        expect(getByText('USD')).toBeOnTheScreen();
        expect(getByText('EUR')).toBeOnTheScreen();
        expect(getByText('PLN')).toBeOnTheScreen();
    });
});
