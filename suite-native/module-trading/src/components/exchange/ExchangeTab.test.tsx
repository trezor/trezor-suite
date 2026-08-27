import { getTranslation } from '@suite-native/intl';

import { ExchangeTab } from './ExchangeTab';
import { renderWithTradingProvider } from '../../test-utils/tradingTestUtils';

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

jest.mock('../../hooks/exchange/useExchangeData', () => ({
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

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: jest.fn(), setParams: jest.fn() }),
    useRoute: () => ({ params: {} }),
}));

describe('ExchangeTab', () => {
    const renderExchangeTab = async () =>
        await renderWithTradingProvider(<ExchangeTab />, { tradeType: 'exchange' });

    beforeEach(() => {
        mockIsDeviceInViewOnlyMode = false;
        mockIsPortfolioTrackerDevice = false;
        mockHasBitcoinOnlyFirmware = false;
        mockIsTradingExchangeEnabled = true;
    });

    it('should render exchange form', async () => {
        const { getByText } = await renderExchangeTab();

        expect(
            getByText(getTranslation('moduleTrading.selectFiat.buy.amountLabel')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.selectFiat.sell.amountLabel')),
        ).toBeOnTheScreen();
    });

    it('should render disabled info when exchange FF is not enabled', async () => {
        mockIsTradingExchangeEnabled = false;
        const { getByText, queryByText } = await renderExchangeTab();

        expect(
            getByText(
                getTranslation('tradingAtoms.error.tradingTypeDisabledTitle', {
                    tradingType: 'Swap',
                }),
            ),
        ).toBeOnTheScreen();
        expect(queryByText(getTranslation('moduleTrading.selectFiat.buy.amountLabel'))).toBeNull();
    });

    it('should display BTC only firmware info with BTC only wallet connected', async () => {
        mockHasBitcoinOnlyFirmware = true;
        const { getByText } = await renderExchangeTab();

        expect(
            getByText(getTranslation('tradingAtoms.error.btcOnlyFirmwareTitle')),
        ).toBeOnTheScreen();
    });

    it('should display Portfolio Tracker info with Portfolio Tracker "wallet" selected', async () => {
        // Portfolio Tracker sets both selectors to true
        mockIsPortfolioTrackerDevice = true;
        mockIsDeviceInViewOnlyMode = true;
        const { getByText, queryByText } = await renderExchangeTab();

        expect(
            getByText(getTranslation('tradingAtoms.error.portfolioTrackerTitle')),
        ).toBeOnTheScreen();
        expect(queryByText('View-only wallet')).toBeNull();
    });

    it('should display exchange form for view-only wallet', async () => {
        mockIsDeviceInViewOnlyMode = true;
        const { getByText } = await renderExchangeTab();

        expect(
            getByText(getTranslation('moduleTrading.selectFiat.buy.amountLabel')),
        ).toBeOnTheScreen();
    });
});
