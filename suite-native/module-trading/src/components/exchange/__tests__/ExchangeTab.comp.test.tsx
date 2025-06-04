import { FeatureFlag } from '@suite-native/feature-flags';
import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { ExchangeTab } from '../ExchangeTab';

let mockIsDeviceInViewOnlyMode = false;
let mockIsPortfolioTrackerDevice = false;
let mockHasBitcoinOnlyFirmware = false;

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectIsDeviceInViewOnlyMode: () => mockIsDeviceInViewOnlyMode,
    selectIsPortfolioTrackerDevice: () => mockIsPortfolioTrackerDevice,
    selectHasBitcoinOnlyFirmware: () => mockHasBitcoinOnlyFirmware,
}));

describe('ExchangeTab', () => {
    const renderExchangeTab = (preloadedState: PreloadedState = {}) =>
        renderWithStoreProviderAsync(<ExchangeTab />, { preloadedState });

    beforeEach(() => {
        mockIsDeviceInViewOnlyMode = false;
        mockIsPortfolioTrackerDevice = false;
        mockHasBitcoinOnlyFirmware = false;
    });

    it('should render tab placeholder', async () => {
        const { getByText } = await renderExchangeTab({
            featureFlags: {
                [FeatureFlag.IsTradingExchangeEnabled]: true,
            },
        });

        expect(getByText('Exchange Tab placeholder')).toBeOnTheScreen();
    });

    it('should render disabled info when exchange FF is not enabled', async () => {
        const { getByText, queryByText } = await renderExchangeTab({
            featureFlags: {
                [FeatureFlag.IsTradingExchangeEnabled]: false,
            },
        });

        expect(queryByText('Exchange Tab placeholder')).toBeNull();
        expect(getByText('Swap disabled')).toBeOnTheScreen();
    });

    it('should display BTC only firmware info with BTC only wallet connected', async () => {
        mockHasBitcoinOnlyFirmware = true;
        const { getByText } = await renderExchangeTab({
            featureFlags: {
                [FeatureFlag.IsTradingExchangeEnabled]: true,
            },
        });

        expect(getByText('Bitcoin-only firmware')).toBeOnTheScreen();
    });

    it('should display Portfolio Tracker info with Portfolio Tracker "wallet" selected', async () => {
        // Portfolio Tracker sets both selectors to true
        mockIsPortfolioTrackerDevice = true;
        mockIsDeviceInViewOnlyMode = true;
        const { getByText, queryByText } = await renderExchangeTab({
            featureFlags: {
                [FeatureFlag.IsTradingExchangeEnabled]: true,
            },
        });

        expect(getByText('Portfolio Tracker')).toBeOnTheScreen();
        expect(queryByText('View-only wallet')).toBeNull();
    });

    it('should display View-only info with view-only wallet', async () => {
        mockIsDeviceInViewOnlyMode = true;
        const { getByText } = await renderExchangeTab({
            featureFlags: {
                [FeatureFlag.IsTradingExchangeEnabled]: true,
            },
        });

        expect(getByText('View-only wallet')).toBeOnTheScreen();
    });
});
