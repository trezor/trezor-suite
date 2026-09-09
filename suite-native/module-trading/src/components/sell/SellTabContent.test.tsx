import type { GetSupportedNetworksDep } from '@suite-common/networks';
import { mockGetSupportedNetworks } from '@suite-common/networks/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { getTranslation } from '@suite-native/intl';
import { act, screen, userEvent } from '@suite-native/test-utils-store';

import { SellTabContent } from './SellTabContent';
import { renderWithTradingProvider } from '../../test-utils/tradingTestUtils';

let mockUseSellData: jest.Mock;
const services: NativeAnalyticsDep & { networks: GetSupportedNetworksDep } = {
    analytics: mockNativeAnalytics(),
    networks: { getSupportedNetworks: mockGetSupportedNetworks() },
};

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({ params: {} }),
}));

jest.mock('../../hooks/sell/useSellData', () => ({
    useSellData: (...params: unknown[]) => mockUseSellData(...params),
}));
jest.mock('@suite-native/trading-state', () => ({
    ...jest.requireActual('@suite-native/trading-state'),
    selectIsTradingSellEnabled: () => true,
}));

jest.mock('../concierge/ConciergeAlert', () => ({
    ConciergeAlert: () => null,
}));

describe('SellTabContent', () => {
    beforeEach(() => {
        mockUseSellData = jest.fn(() => ({
            isLoading: false,
            lastLoadedTimestamp: 0,
            isFullyLoaded: false,
        }));
    });

    const renderSellTabContent = async () =>
        await renderWithTradingProvider(<SellTabContent />, { services, tradeType: 'sell' });

    const expectSkeleton = () => {
        expect(screen.getAllByTestId('BoxSkeleton').length).toBeGreaterThan(0);
    };

    const expectSellForm = () => {
        expect(
            screen.getByText(getTranslation('moduleTrading.selectFiat.sell.title')),
        ).toBeOnTheScreen();
    };

    const expectServerOffline = () => {
        expect(
            screen.getByText(getTranslation('tradingAtoms.error.serverOfflineTitle')),
        ).toBeOnTheScreen();
    };

    it('should render Sell skeleton when isLoading is true', async () => {
        mockUseSellData.mockReturnValue({
            isLoading: true,
            lastLoadedTimestamp: 1,
            isFullyLoaded: false,
        });

        await renderSellTabContent();

        expectSkeleton();
    });

    it('should render Sell skeleton when lastLoadedTimestamp is 0', async () => {
        mockUseSellData.mockReturnValue({
            isLoading: false,
            lastLoadedTimestamp: 0,
            isFullyLoaded: false,
        });

        await renderSellTabContent();

        expectSkeleton();
    });

    it('should render Sell form when isLoading is false, lastLoadedTimestamp is greater than 0 and isFullyLoaded true', async () => {
        mockUseSellData.mockReturnValue({
            isLoading: false,
            lastLoadedTimestamp: 1,
            isFullyLoaded: true,
        });

        await renderSellTabContent();

        expectSellForm();
    });

    it('should render server error info when isLoading is false, lastLoadedTimestamp is greater than 0 and isFullyLoaded false', async () => {
        mockUseSellData.mockReturnValue({
            isLoading: false,
            lastLoadedTimestamp: 1,
            isFullyLoaded: false,
        });

        await renderSellTabContent();

        expectServerOffline();
    });

    it('should reload data when server error info is displayed and user presses "Try again" button', async () => {
        mockUseSellData
            .mockReturnValueOnce({
                isLoading: false,
                lastLoadedTimestamp: 1,
                isFullyLoaded: false,
            })
            .mockReturnValue({
                isLoading: false,
                lastLoadedTimestamp: 1,
                isFullyLoaded: true,
            });

        const { getByText } = await renderSellTabContent();

        const reloadButton = getByText(getTranslation('tradingAtoms.error.serverOfflineRetry'));

        await act(async () => {
            await userEvent.press(reloadButton);
        });

        expectSellForm();
        expect(mockUseSellData).toHaveBeenCalledTimes(2);
        expect(mockUseSellData).toHaveBeenCalledWith(0);
        expect(mockUseSellData).toHaveBeenCalledWith(1);
    });
});
