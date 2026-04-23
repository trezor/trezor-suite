import { renderWithStoreProvider, screen } from '@suite-native/test-utils-store';
import { getWalletState } from '@suite-native/trading-fixtures';

import { BuyFiatCurrencySheet } from '../BuyFiatCurrencySheet';

describe('BuyFiatCurrencySheet', () => {
    const renderBuyFiatCurrencySheet = () =>
        renderWithStoreProvider(
            <BuyFiatCurrencySheet onFiatSelect={jest.fn()} onClose={jest.fn()} isVisible={true} />,
            {
                preloadedState: { wallet: getWalletState({ tradeType: 'buy' }) },
                providers: ['intl'],
            },
        );

    afterEach(() => {
        screen.unmount();
    });

    it('should render items based on buy state', () => {
        const { getByText } = renderBuyFiatCurrencySheet();

        expect(getByText('USD')).toBeOnTheScreen();
        expect(getByText('EUR')).toBeOnTheScreen();
        expect(getByText('CZK')).toBeOnTheScreen();
    });
});
