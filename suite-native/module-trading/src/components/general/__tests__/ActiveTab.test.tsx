import { type TradingType } from '@suite-common/trading';
import { type PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';

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
        renderWithStoreProviderAsync(<ActiveTab />, { preloadedState });

    it.each<[TradingType, string]>([
        ['buy', 'Buy disabled'],
        ['exchange', 'Swap disabled'],
        ['sell', 'Sell disabled'],
    ])('should display correct trading type tab for %s', async (tradingType, expectedTitle) => {
        const { getByText } = await renderActiveTab({
            wallet: { trading: { activeTradingType: tradingType } },
        });

        expect(getByText(expectedTitle)).toBeOnTheScreen();
    });

    it('should render nothing when no active tab is specified', async () => {
        const { toJSON } = await renderActiveTab({
            wallet: { trading: { activeTradingType: undefined } },
        });

        expect(toJSON()).toBeNull();
    });
});
