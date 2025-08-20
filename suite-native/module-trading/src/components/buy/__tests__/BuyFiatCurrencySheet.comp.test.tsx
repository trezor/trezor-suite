import { renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { getWalletState } from '../../../__fixtures__/walletState';
import { BuyFiatCurrencySheet } from '../BuyFiatCurrencySheet';

describe('BuyFiatCurrencySheet', () => {
    const renderBuyFiatCurrencySheet = () =>
        renderWithStoreProviderAsync(
            <BuyFiatCurrencySheet onFiatSelect={jest.fn()} onClose={jest.fn()} isVisible={true} />,
            { preloadedState: { wallet: getWalletState({ tradeType: 'buy' }) } },
        );

    it('should render items based on buy state', async () => {
        const { getByText } = await renderBuyFiatCurrencySheet();

        expect(getByText('USD')).toBeOnTheScreen();
        expect(getByText('EUR')).toBeOnTheScreen();
        expect(getByText('CZK')).toBeOnTheScreen();
    });
});
