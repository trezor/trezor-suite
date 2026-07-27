import { getTranslation } from '@suite-native/intl';

import { renderWithTradingProvider } from '../../../__tests__/tradingTestUtils';
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
    const renderExchangeTab = () =>
        renderWithTradingProvider(<ExchangeTab />, { tradeType: 'exchange' });

    beforeEach(() => {
        mockIsDeviceInViewOnlyMode = false;
        mockIsPortfolioTrackerDevice = false;
        mockHasBitcoinOnlyFirmware = false;
        mockIsTradingExchangeEnabled = true;
    });

    it('should render exchange form', () => {
        const { getByText } = renderExchangeTab();

        expect(
            getByText(getTranslation('moduleTrading.selectFiat.buy.amountLabel')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.selectFiat.sell.amountLabel')),
        ).toBeOnTheScreen();
    });

    it('should render disabled info when exchange FF is not enabled', () => {
        mockIsTradingExchangeEnabled = false;
        const { getByText, queryByText } = renderExchangeTab();

        expect(
            getByText(
                getTranslation('tradingAtoms.error.tradingTypeDisabledTitle', {
                    tradingType: 'Swap',
                }),
            ),
        ).toBeOnTheScreen();
        expect(queryByText(getTranslation('moduleTrading.selectFiat.buy.amountLabel'))).toBeNull();
    });

    it('should display BTC only firmware info with BTC only wallet connected', () => {
        mockHasBitcoinOnlyFirmware = true;
        const { getByText } = renderExchangeTab();

        expect(
            getByText(getTranslation('tradingAtoms.error.btcOnlyFirmwareTitle')),
        ).toBeOnTheScreen();
    });

    it('should display Portfolio Tracker info with Portfolio Tracker "wallet" selected', () => {
        // Portfolio Tracker sets both selectors to true
        mockIsPortfolioTrackerDevice = true;
        mockIsDeviceInViewOnlyMode = true;
        const { getByText, queryByText } = renderExchangeTab();

        expect(
            getByText(getTranslation('tradingAtoms.error.portfolioTrackerTitle')),
        ).toBeOnTheScreen();
        expect(queryByText('View-only wallet')).toBeNull();
    });

    it('should display exchange form for view-only wallet', () => {
        mockIsDeviceInViewOnlyMode = true;
        const { getByText } = renderExchangeTab();

        expect(
            getByText(getTranslation('moduleTrading.selectFiat.buy.amountLabel')),
        ).toBeOnTheScreen();
    });
});
