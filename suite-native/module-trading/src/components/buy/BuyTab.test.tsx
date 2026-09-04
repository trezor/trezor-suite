import type { GetSupportedNetworksDep } from '@suite-common/networks';
import { mockGetSupportedNetworks } from '@suite-common/networks/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { getTranslation } from '@suite-native/intl';
import { act, screen, userEvent } from '@suite-native/test-utils-store';
import { selectIsTradingBuyEnabled } from '@suite-native/trading-state';

import { BuyTab } from './BuyTab';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

let mockUseTradingBuyData: jest.Mock;
const services: NativeAnalyticsDep & { networks: GetSupportedNetworksDep } = {
    analytics: mockNativeAnalytics(),
    networks: { getSupportedNetworks: mockGetSupportedNetworks() },
};

jest.mock('../../hooks/buy/useBuyData', () => ({
    useBuyData: (...params: unknown[]) => mockUseTradingBuyData(...params),
}));

jest.mock('@suite-native/trading-state', () => ({
    ...jest.requireActual('@suite-native/trading-state'),
    selectIsTradingBuyEnabled: jest.fn(),
}));

jest.mock('../concierge/ConciergeAlert', () => ({
    ConciergeAlert: () => null,
}));

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: jest.fn(), setParams: jest.fn() }),
    useRoute: () => ({ params: {} }),
}));

describe('BuyTab', () => {
    beforeEach(() => {
        mockUseTradingBuyData = jest.fn(() => ({
            isLoading: false,
            lastLoadedTimestamp: 0,
            isFullyLoaded: false,
        }));
        (selectIsTradingBuyEnabled as jest.Mock).mockReturnValue(true);
    });

    const renderBuyTab = async (overrides?: PreloadedStatePartial<TradingTestPreloadedState>) =>
        await renderWithTradingProvider(<BuyTab />, { overrides, services });

    const expectSkeleton = () => {
        expect(screen.getAllByTestId('BoxSkeleton').length).toBeGreaterThan(0);
    };

    const expectBuyForm = () => {
        expect(
            screen.getByText(getTranslation('moduleTrading.selectFiat.buy.amountLabel')),
        ).toBeTruthy();
    };

    const expectServerOffline = () => {
        expect(screen.getByText("It's not you, it's us.")).toBeTruthy();
    };

    it('should render Buy skeleton when isLoading is true', async () => {
        mockUseTradingBuyData.mockReturnValue({
            isLoading: true,
            lastLoadedTimestamp: 1,
            isFullyLoaded: false,
        });

        await renderBuyTab();

        expectSkeleton();
    });

    it('should render Buy skeleton when lastLoadedTimestamp is 0', async () => {
        mockUseTradingBuyData.mockReturnValue({
            isLoading: false,
            lastLoadedTimestamp: 0,
            isFullyLoaded: false,
        });

        await renderBuyTab();

        expectSkeleton();
    });

    it('should render Buy form when isLoading is false, lastLoadedTimestamp is greater than 0 and isFullyLoaded true', async () => {
        mockUseTradingBuyData.mockReturnValue({
            isLoading: false,
            lastLoadedTimestamp: 1,
            isFullyLoaded: true,
        });

        await renderBuyTab();

        expectBuyForm();
    });

    it('should render server error info when isLoading is false, lastLoadedTimestamp is greater than 0 and isFullyLoaded false', async () => {
        mockUseTradingBuyData.mockReturnValue({
            isLoading: false,
            lastLoadedTimestamp: 1,
            isFullyLoaded: false,
        });

        await renderBuyTab();

        expectServerOffline();
    });

    it('should reload data when server error info is displayed and user presses "Try again" button', async () => {
        mockUseTradingBuyData
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

        const { getByText } = await renderBuyTab();

        const reloadButton = getByText(getTranslation('tradingAtoms.error.serverOfflineRetry'));

        await act(async () => {
            await userEvent.press(reloadButton);
        });

        expectBuyForm();
        expect(mockUseTradingBuyData).toHaveBeenCalledTimes(2);
        expect(mockUseTradingBuyData).toHaveBeenCalledWith(0);
        expect(mockUseTradingBuyData).toHaveBeenCalledWith(1);
    });

    it('should render disabled info when buy is disabled by FFs', async () => {
        (selectIsTradingBuyEnabled as jest.Mock).mockReturnValue(false);
        const { getByText } = await renderBuyTab();

        expect(
            getByText(
                getTranslation('tradingAtoms.error.tradingTypeDisabledTitle', {
                    tradingType: 'Buy',
                }),
            ),
        ).toBeOnTheScreen();
    });
});
