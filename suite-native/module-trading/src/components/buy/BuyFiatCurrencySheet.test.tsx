import { renderWithStoreProvider, screen } from '@suite-native/test-utils-store';
import { getWalletState } from '@suite-native/trading-fixtures';

import { BuyFiatCurrencySheet } from './BuyFiatCurrencySheet';

describe('BuyFiatCurrencySheet', () => {
    const renderBuyFiatCurrencySheet = async () =>
        await renderWithStoreProvider(
            <BuyFiatCurrencySheet onFiatSelect={jest.fn()} onClose={jest.fn()} isVisible={true} />,
            { preloadedState: { wallet: getWalletState({ tradeType: 'buy' }) } },
        );

    afterEach(async () => {
        await screen.unmount();
    });

    it('should render items based on buy state', async () => {
        const { getByText } = await renderBuyFiatCurrencySheet();

        expect(getByText('USD')).toBeOnTheScreen();
        expect(getByText('EUR')).toBeOnTheScreen();
        expect(getByText('CZK')).toBeOnTheScreen();
    });
});
