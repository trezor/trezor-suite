import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';
import type { GetSupportedNetworksDep } from '@suite-common/networks';
import { mockGetSupportedNetworks } from '@suite-common/networks/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { getTranslation } from '@suite-native/intl';
import { screen } from '@suite-native/test-utils-store';
import { tradingInitialState } from '@suite-native/trading-state';

import { TradingTabContent } from './TradingTabContent';
import { renderWithTradingProvider } from '../../test-utils/tradingTestUtils';

let mockIsInternetReachable: boolean | null = true;
const services: NativeAnalyticsDep & { networks: GetSupportedNetworksDep } = {
    analytics: mockNativeAnalytics(),
    networks: { getSupportedNetworks: mockGetSupportedNetworks() },
};

jest.mock('@react-native-community/netinfo', () => ({
    useNetInfo: () => ({
        isInternetReachable: mockIsInternetReachable,
    }),
}));

jest.mock('../../hooks/buy/useBuyData', () => ({
    useBuyData: () => ({
        isLoading: false,
        lastLoadedTimestamp: 1,
        isFullyLoaded: true,
    }),
}));

jest.mock('../concierge/ConciergeAlert', () => ({
    ConciergeAlert: () => null,
}));

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: jest.fn(), setParams: jest.fn() }),
    useRoute: () => ({ params: {} }),
}));

describe('TradingTabContent', () => {
    const renderTradingTabContent = async (isBlacklisted: boolean = false) =>
        await renderWithTradingProvider(<TradingTabContent />, {
            services,
            overrides: {
                wallet: {
                    trading: {
                        ...tradingInitialState,
                        activeTradingType: 'buy',
                    },
                },
                messageSystem: mockMessageSystemStateWithFeatureFlags({
                    'trading.restrictions.blacklist': isBlacklisted,
                }),
            },
        });

    const expectDeviceOffline = () => {
        expect(
            screen.getByText(getTranslation('tradingAtoms.error.deviceOfflineTitle')),
        ).toBeOnTheScreen();
    };

    const expectTradingNotAllowedInCountry = () => {
        expect(
            screen.getByText(getTranslation('tradingAtoms.error.notAvailableInCountryTitle')),
        ).toBeOnTheScreen();
    };

    const expectBuyForm = () => {
        expect(
            screen.getByText(getTranslation('moduleTrading.selectFiat.buy.amountLabel')),
        ).toBeOnTheScreen();
    };

    beforeEach(() => {
        mockIsInternetReachable = true;
    });

    it('should render error screen when isInternetReachable is false', async () => {
        mockIsInternetReachable = false;

        await renderTradingTabContent();

        expectDeviceOffline();
    });

    it('should render trading not allowed in your country warning when ff is set up', async () => {
        await renderTradingTabContent(true);

        expectTradingNotAllowedInCountry();
    });

    it('trading not allowed should have priority over offline notice', async () => {
        mockIsInternetReachable = false;

        await renderTradingTabContent(true);

        expectTradingNotAllowedInCountry();
    });

    it('should render form even when isInternetReachable is null', async () => {
        mockIsInternetReachable = null;

        await renderTradingTabContent();

        expectBuyForm();
    });
});
