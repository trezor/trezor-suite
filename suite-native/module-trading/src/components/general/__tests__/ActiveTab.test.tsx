import { type TradingType } from '@suite-common/trading';
import { type PreloadedState, renderWithStoreProvider } from '@suite-native/test-utils-store';

import { ActiveTab } from '../ActiveTab';

// for the sake of easier testing, we mock the flags to return false
jest.mock('@suite-native/trading-state', () => ({
    ...jest.requireActual('@suite-native/trading-state'),
    selectIsTradingBuyEnabled: () => false,
    selectIsTradingExchangeEnabled: () => false,
    selectIsTradingSellEnabled: () => false,
}));

describe('ActiveTab', () => {
    const renderActiveTab = (preloadedState: PreloadedState) =>
        renderWithStoreProvider(<ActiveTab />, { preloadedState });

    it.each<[TradingType, string]>([
        ['buy', 'Buy disabled'],
        ['exchange', 'Swap disabled'],
        ['sell', 'Sell disabled'],
    ])('should display correct trading type tab for %s', (tradingType, expectedTitle) => {
        const { getByText } = renderActiveTab({
            wallet: { trading: { activeTradingType: tradingType } },
        });

        expect(getByText(expectedTitle)).toBeOnTheScreen();
    });

    it('should render nothing when no active tab is specified', () => {
        const { toJSON } = renderActiveTab({
            wallet: { trading: { activeTradingType: undefined } },
        });

        expect(toJSON()).toBeNull();
    });
});
