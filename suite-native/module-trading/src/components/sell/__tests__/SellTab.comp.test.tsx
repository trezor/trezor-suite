import { FeatureFlag } from '@suite-native/feature-flags';
import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { SellTab } from '../SellTab';

let mockIsDeviceInViewOnlyMode = false;
let mockIsPortfolioTrackerDevice = false;

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectIsDeviceInViewOnlyMode: () => mockIsDeviceInViewOnlyMode,
    selectIsPortfolioTrackerDevice: () => mockIsPortfolioTrackerDevice,
}));

jest.mock('../../../hooks/sell/useSellData', () => ({
    useSellData: () => ({
        isLoading: false,
        lastLoadedTimestamp: 1,
        isFullyLoaded: true,
    }),
}));

describe('SellTab', () => {
    const renderSellTab = (preloadedState: PreloadedState = {}) =>
        renderWithStoreProviderAsync(<SellTab />, { preloadedState });

    beforeEach(() => {
        mockIsDeviceInViewOnlyMode = false;
        mockIsPortfolioTrackerDevice = false;
    });

    it('should render disabled info when sell FF is not enabled', async () => {
        const { getByText } = await renderSellTab({
            featureFlags: {
                [FeatureFlag.IsTradingSellEnabled]: false,
            },
        });

        expect(getByText('Sell disabled')).toBeOnTheScreen();
    });

    it('should display Portfolio Tracker info with Portfolio Tracker "wallet" selected', async () => {
        // Portfolio Tracker sets both selectors to true
        mockIsPortfolioTrackerDevice = true;
        mockIsDeviceInViewOnlyMode = true;
        const { getByText, queryByText } = await renderSellTab({
            featureFlags: {
                [FeatureFlag.IsTradingSellEnabled]: true,
            },
        });

        expect(getByText('Portfolio Tracker')).toBeOnTheScreen();
        expect(queryByText('View-only wallet')).toBeNull();
    });

    it('should display View-only info with view-only wallet', async () => {
        mockIsDeviceInViewOnlyMode = true;
        const { getByText } = await renderSellTab({
            featureFlags: {
                [FeatureFlag.IsTradingSellEnabled]: true,
            },
        });

        expect(getByText('View-only wallet')).toBeOnTheScreen();
    });
});
