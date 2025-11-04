import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';
import { getWalletState, sellQuotes } from '@suite-native/trading-fixtures';

import { TradingSellPreviewScreen } from '../TradingSellPreviewScreen';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({ name: 'TradingSellPreviewScreen' }),
}));

describe('TradingSellPreviewScreen', () => {
    const renderTradingSellPreviewScreen = (preloadedState?: PreloadedState) =>
        renderWithStoreProviderAsync(<TradingSellPreviewScreen />, { preloadedState });

    it('should render screen with header and preview view', async () => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({ tradeType: 'sell' }),
        };
        preloadedState.wallet!.trading!.sell!.selectedQuote = sellQuotes[0];

        const { getByText } = await renderTradingSellPreviewScreen(preloadedState);

        expect(getByText('Sell')).toBeOnTheScreen();
        expect(getByText('To')).toBeOnTheScreen();
        expect(getByText('Credit/Debit Card')).toBeOnTheScreen();
    });
});
