import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import { PreloadedState, renderWithStoreProviderAsync, screen } from '@suite-native/test-utils';

import { TradingScreen } from '../TradingScreen';

let mockIsInternetReachable: boolean | null = true;

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({ name: 'TradingScreen' }),
}));

jest.mock('../../hooks/buy/useBuyData', () => ({
    useBuyData: () => ({
        isLoading: false,
        lastLoadedTimestamp: 1,
        isFullyLoaded: true,
    }),
}));

jest.mock('../../hooks/exchange/useExchangeData', () => ({
    useExchangeData: () => ({
        isLoading: false,
        lastLoadedTimestamp: 1,
        isFullyLoaded: true,
    }),
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

const stateWithDisabledTrading = {
    featureFlags: {
        ...featureFlagsInitialState,
        [FeatureFlag.IsTradingBuyEnabled]: false,
    },
    messageSystem: {
        validMessages: {
            feature: ['actionId'],
            banner: [],
            context: [],
            modal: [],
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

const stateWithEnabledExchange = {
    ...stateWithDisabledTrading,
    featureFlags: {
        ...featureFlagsInitialState,
        [FeatureFlag.IsTradingBuyEnabled]: false,
        [FeatureFlag.IsTradingExchangeEnabled]: true,
    },
};

describe('TradingScreen', () => {
    beforeEach(() => {
        mockIsInternetReachable = true;
    });

    const renderTradingScreen = (preloadedState?: PreloadedState) =>
        renderWithStoreProviderAsync(<TradingScreen />, { preloadedState });

    const expectBuyForm = () => {
        expect(screen.getByText('You pay')).toBeOnTheScreen();
    };

    const expectExchangeForm = () => {
        expect(screen.getByText('You pay')).toBeOnTheScreen();
        expect(screen.getByText('You get')).toBeOnTheScreen();
    };

    const expectDeviceOffline = () => {
        expect(screen.getByText('Trading is not available offline')).toBeOnTheScreen();
    };

    it('should render nothing when trading feature flag is not enabled', async () => {
        const { toJSON } = await renderTradingScreen(stateWithDisabledTrading);

        expect(toJSON()).toBeNull();
    });

    it('should render error screen when isInternetReachable is false', async () => {
        mockIsInternetReachable = false;

        await renderTradingScreen(stateWithEnabledBuy);

        expectDeviceOffline();
    });

    it('should render Buy form by default', async () => {
        await renderTradingScreen(stateWithEnabledBuy);

        expectBuyForm();
    });

    it('should render exchange form when only exchange feature flag is enabled', async () => {
        await renderTradingScreen(stateWithEnabledExchange);

        expectExchangeForm();
    });

    it('should render form even when isInternetReachable is null', async () => {
        mockIsInternetReachable = null;

        await renderTradingScreen(stateWithEnabledBuy);

        expectBuyForm();
    });
});
