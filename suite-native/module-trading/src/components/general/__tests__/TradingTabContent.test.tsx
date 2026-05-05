import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';
import { screen } from '@suite-native/test-utils-store';
import { tradingInitialState } from '@suite-native/trading-state';

import { renderWithTradingProvider } from '../../../__tests__/tradingTestUtils';
import { TradingTabContent } from '../TradingTabContent';

let mockIsInternetReachable: boolean | null = true;

jest.mock('@react-native-community/netinfo', () => ({
    useNetInfo: () => ({
        isInternetReachable: mockIsInternetReachable,
    }),
}));

jest.mock('../../../hooks/buy/useBuyData', () => ({
    useBuyData: () => ({
        isLoading: false,
        lastLoadedTimestamp: 1,
        isFullyLoaded: true,
    }),
}));

jest.mock('../../concierge/ConciergeAlert', () => ({
    ConciergeAlert: () => null,
}));

describe('TradingTabContent', () => {
    const renderTradingTabContent = (isBlacklisted: boolean = false) =>
        renderWithTradingProvider(<TradingTabContent />, {
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
        expect(screen.getByText('Trading is not available offline')).toBeOnTheScreen();
    };

    const expectTradingNotAllowedInCountry = () => {
        expect(screen.getByText('Trading is not yet available in your country')).toBeOnTheScreen();
    };

    const expectBuyForm = () => {
        expect(screen.getByText('You pay')).toBeOnTheScreen();
    };

    beforeEach(() => {
        mockIsInternetReachable = true;
    });

    it('should render error screen when isInternetReachable is false', () => {
        mockIsInternetReachable = false;

        renderTradingTabContent();

        expectDeviceOffline();
    });

    it('should render trading not allowed in your country warning when ff is set up', () => {
        renderTradingTabContent(true);

        expectTradingNotAllowedInCountry();
    });

    it('trading not allowed should have priority over offline notice', () => {
        mockIsInternetReachable = false;

        renderTradingTabContent(true);

        expectTradingNotAllowedInCountry();
    });

    it('should render form even when isInternetReachable is null', () => {
        mockIsInternetReachable = null;

        renderTradingTabContent();

        expectBuyForm();
    });
});
