import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';
import { getTranslation } from '@suite-native/intl';
import { act } from '@suite-native/test-utils-store';

import { SellTab } from './SellTab';
import { renderWithTradingProvider } from '../../__tests__/tradingTestUtils';

let mockIsDeviceInViewOnlyMode = false;
let mockIsPortfolioTrackerDevice = false;

jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectIsDeviceInViewOnlyMode: () => mockIsDeviceInViewOnlyMode,
    selectIsPortfolioTrackerDevice: () => mockIsPortfolioTrackerDevice,
}));

jest.mock('../../hooks/sell/useSellData', () => ({
    useSellData: () => ({
        isLoading: false,
        lastLoadedTimestamp: 1,
        isFullyLoaded: true,
    }),
}));

jest.mock('../concierge/ConciergeAlert', () => ({
    ConciergeAlert: () => null,
}));

describe('SellTab', () => {
    const renderSellTab = async (overrides: Record<string, unknown> = {}) => {
        const result = renderWithTradingProvider(<SellTab />, {
            tradeType: 'sell',
            overrides,
        });

        // wait for form reactions to run
        await act(() => Promise.resolve());

        return result;
    };

    beforeEach(() => {
        mockIsDeviceInViewOnlyMode = false;
        mockIsPortfolioTrackerDevice = false;
    });

    it('should render disabled info when sell FF is not enabled', async () => {
        const { getByText } = await renderSellTab({
            messageSystem: mockMessageSystemStateWithFeatureFlags({ 'trading.sell': false }),
        });

        expect(
            getByText(
                getTranslation('tradingAtoms.error.tradingTypeDisabledTitle', {
                    tradingType: 'Sell',
                }),
            ),
        ).toBeOnTheScreen();
    });

    it('should display Portfolio Tracker info with Portfolio Tracker "wallet" selected', async () => {
        // Portfolio Tracker sets both selectors to true
        mockIsPortfolioTrackerDevice = true;
        mockIsDeviceInViewOnlyMode = true;
        const { getByText, queryByText } = await renderSellTab({});

        expect(
            getByText(getTranslation('tradingAtoms.error.portfolioTrackerTitle')),
        ).toBeOnTheScreen();
        expect(queryByText('View-only wallet')).toBeNull();
    });

    it('should display form even with view-only wallet', async () => {
        mockIsDeviceInViewOnlyMode = true;
        const { getByText } = await renderSellTab({});

        expect(getByText(getTranslation('moduleTrading.selectCoin.buttonTitle'))).toBeOnTheScreen();
    });

    it('should display form otherwise', async () => {
        const { getByText } = await renderSellTab({});

        expect(getByText(getTranslation('moduleTrading.selectCoin.buttonTitle'))).toBeOnTheScreen();
    });
});
