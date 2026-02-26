import { screen } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import { renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
import { tradingInitialState } from '@suite-native/trading-state';

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

describe('TradingTabContent', () => {
    const renderTradingTabContent = (isBlacklisted: boolean = false) =>
        renderWithStoreProviderAsync(<TradingTabContent />, {
            preloadedState: {
                wallet: {
                    trading: {
                        ...tradingInitialState,
                        activeTradingType: 'buy',
                    },
                },
                messageSystem: {
                    validMessages: {
                        feature: ['actionId'],
                        banner: [],
                        context: [],
                        modal: [],
                    },
                    dismissedMessages: {},
                    config: {
                        actions: [
                            {
                                message: {
                                    id: 'actionId',
                                    category: ['feature'],
                                    feature: [
                                        {
                                            domain: 'trading.restrictions.blacklist',
                                            flag: isBlacklisted,
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                },
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
