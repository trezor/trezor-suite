import { screen } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import { renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
import { getWalletState } from '@suite-native/trading-fixtures';

import { BuyFiatCurrencySheet } from '../BuyFiatCurrencySheet';

describe('BuyFiatCurrencySheet', () => {
    const renderBuyFiatCurrencySheet = () =>
        renderWithStoreProviderAsync(
            <BuyFiatCurrencySheet onFiatSelect={jest.fn()} onClose={jest.fn()} isVisible={true} />,
            { preloadedState: { wallet: getWalletState({ tradeType: 'buy' }) } },
        );

    afterEach(() => {
        screen.unmount();
    });

    it('should render items based on buy state', async () => {
        const { getByText } = await renderBuyFiatCurrencySheet();

        expect(getByText('USD')).toBeOnTheScreen();
        expect(getByText('EUR')).toBeOnTheScreen();
        expect(getByText('CZK')).toBeOnTheScreen();
    });
});
