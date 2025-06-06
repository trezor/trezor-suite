import { TradingType } from '@suite-common/trading/';
import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { ActiveTab } from '../ActiveTab';

// for the sake of easier testing, we mock the flags to return false
jest.mock('../../../selectors/commonSelectors', () => ({
    ...jest.requireActual('../../../selectors/commonSelectors'),
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
    ])('should display correct trading type tab for %s', async (tradingType, expectedTitle) => {
        const { getByText } = await renderActiveTab({
            wallet: { tradingNew: { activeTradingType: tradingType } },
        });

        expect(getByText(expectedTitle)).toBeOnTheScreen();
    });

    it('should render nothing for sell', async () => {
        const { toJSON } = await renderActiveTab({
            wallet: { tradingNew: { activeTradingType: 'sell' } },
        });

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when no active tab is specified', async () => {
        const { toJSON } = await renderActiveTab({
            wallet: { tradingNew: { activeTradingType: undefined } },
        });

        expect(toJSON()).toBeNull();
    });
});
