import { type PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { ExchangeTab } from '../ExchangeTab';

let mockIsDeviceInViewOnlyMode = false;
let mockIsPortfolioTrackerDevice = false;
let mockHasBitcoinOnlyFirmware = false;
let mockIsTradingExchangeEnabled = true;

jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectIsDeviceInViewOnlyMode: () => mockIsDeviceInViewOnlyMode,
    selectIsPortfolioTrackerDevice: () => mockIsPortfolioTrackerDevice,
    selectHasBitcoinOnlyFirmware: () => mockHasBitcoinOnlyFirmware,
}));

jest.mock('../../../hooks/exchange/useExchangeData', () => ({
    useExchangeData: () => ({
        isLoading: false,
        lastLoadedTimestamp: 1,
        isFullyLoaded: true,
    }),
}));

jest.mock('@suite-native/trading-state', () => ({
    ...jest.requireActual('@suite-native/trading-state'),
    selectIsTradingExchangeEnabled: () => mockIsTradingExchangeEnabled,
}));

describe('ExchangeTab', () => {
    const renderExchangeTab = (preloadedState: PreloadedState = {}) =>
        renderWithStoreProviderAsync(<ExchangeTab />, { preloadedState });

    beforeEach(() => {
        mockIsDeviceInViewOnlyMode = false;
        mockIsPortfolioTrackerDevice = false;
        mockHasBitcoinOnlyFirmware = false;
        mockIsTradingExchangeEnabled = true;
    });

    it('should render exchange form', async () => {
        const { getByText } = await renderExchangeTab();

        expect(getByText('You pay')).toBeOnTheScreen();
        expect(getByText('You get')).toBeOnTheScreen();
    });

    it('should render disabled info when exchange FF is not enabled', async () => {
        mockIsTradingExchangeEnabled = false;
        const { getByText, queryByText } = await renderExchangeTab();

        expect(getByText('Swap disabled')).toBeOnTheScreen();
        expect(queryByText('You pay')).toBeNull();
    });

    it('should display BTC only firmware info with BTC only wallet connected', async () => {
        mockHasBitcoinOnlyFirmware = true;
        const { getByText } = await renderExchangeTab();

        expect(getByText('Bitcoin-only firmware')).toBeOnTheScreen();
    });

    it('should display Portfolio Tracker info with Portfolio Tracker "wallet" selected', async () => {
        // Portfolio Tracker sets both selectors to true
        mockIsPortfolioTrackerDevice = true;
        mockIsDeviceInViewOnlyMode = true;
        const { getByText, queryByText } = await renderExchangeTab();

        expect(getByText('Portfolio Tracker')).toBeOnTheScreen();
        expect(queryByText('View-only wallet')).toBeNull();
    });

    it('should display exchange form for view-only wallet', async () => {
        mockIsDeviceInViewOnlyMode = true;
        const { getByText } = await renderExchangeTab();

        expect(getByText('You pay')).toBeOnTheScreen();
    });
});
