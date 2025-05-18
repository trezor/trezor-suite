import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import {
    PreloadedState,
    act,
    renderWithStoreProviderAsync,
    screen,
    userEvent,
} from '@suite-native/test-utils';

import { TradingScreen } from '../TradingScreen';

let mockUseTradingBuyData: jest.Mock;

let mockIsInternetReachable: boolean | null = true;

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({ name: 'TradingScreen' }),
}));

jest.mock('../../hooks/buy/useBuyData', () => ({
    useBuyData: (...params: unknown[]) => mockUseTradingBuyData(...params),
}));

jest.mock('@react-native-community/netinfo', () => ({
    useNetInfo: () => ({
        isInternetReachable: mockIsInternetReachable,
    }),
}));

const stateWithEnabledBuy = {
    featureFlags: {
        ...featureFlagsInitialState,
        [FeatureFlag.IsTradingBuyEnabled]: true,
    },
};

const stateWithDisabledBuy = {
    featureFlags: {
        ...featureFlagsInitialState,
        [FeatureFlag.IsTradingBuyEnabled]: false,
    },
    messageSystem: {
        validMessages: {
            feature: ['actionId'],
        },
        dismissedMessages: [],
        config: {
            actions: [
                {
                    message: {
                        id: 'actionId',
                        category: ['feature'],
                        feature: [
                            {
                                domain: 'trading.buy',
                                flag: false,
                            },
                        ],
                    },
                },
            ],
        },
    },
} as unknown as PreloadedState;

describe('TradingScreen', () => {
    beforeEach(() => {
        mockUseTradingBuyData = jest.fn(() => ({
            isLoading: false,
            lastLoadedTimestamp: 0,
            isFullyLoaded: false,
        }));

        mockIsInternetReachable = true;
    });

    const renderTradingScreen = (preloadedState?: PreloadedState) =>
        renderWithStoreProviderAsync(<TradingScreen />, { preloadedState });

    const expectSkeleton = () => {
        expect(screen.getByText('Buy')).toBeTruthy();
    };

    const expectBuyForm = () => {
        expect(screen.getByText('You pay')).toBeTruthy();
    };

    const expectDeviceOffline = () => {
        expect(screen.getByText('Trading is not available offline')).toBeTruthy();
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

        await renderTradingScreen(stateWithEnabledBuy);

        expectSkeleton();
    });

    it('should render Buy skeleton when lastLoadedTimestamp is 0', async () => {
        mockUseTradingBuyData.mockReturnValue({
            isLoading: false,
            lastLoadedTimestamp: 0,
            isFullyLoaded: false,
        });

        await renderTradingScreen(stateWithEnabledBuy);

        expectSkeleton();
    });

    it('should render Buy form when isLoading is false, lastLoadedTimestamp is greater than 0 and isFullyLoaded true', async () => {
        mockUseTradingBuyData.mockReturnValue({
            isLoading: false,
            lastLoadedTimestamp: 1,
            isFullyLoaded: true,
        });

        await renderTradingScreen(stateWithEnabledBuy);

        expectBuyForm();
    });

    it('should not render Buy form when feature flag is not enabled', async () => {
        mockUseTradingBuyData.mockReturnValue({
            isLoading: false,
            lastLoadedTimestamp: 1,
            isFullyLoaded: true,
        });

        const { queryByText } = await renderTradingScreen(stateWithDisabledBuy);

        expect(queryByText('Buy')).toBeNull();
    });

    it('should render error screen when isInternetReachable is false', async () => {
        mockIsInternetReachable = false;

        await renderTradingScreen(stateWithEnabledBuy);

        expectDeviceOffline();
    });

    it('should render server error info when isLoading is false, lastLoadedTimestamp is greater than 0 and isFullyLoaded false', async () => {
        mockUseTradingBuyData.mockReturnValue({
            isLoading: false,
            lastLoadedTimestamp: 1,
            isFullyLoaded: false,
        });

        await renderTradingScreen(stateWithEnabledBuy);

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

        const { getByText } = await renderTradingScreen(stateWithEnabledBuy);

        const reloadButton = getByText('Try again');

        await act(async () => {
            await userEvent.press(reloadButton);
        });

        expectBuyForm();
        expect(mockUseTradingBuyData).toHaveBeenCalledTimes(2);
        expect(mockUseTradingBuyData).toHaveBeenCalledWith(0);
        expect(mockUseTradingBuyData).toHaveBeenCalledWith(1);
    });
});
