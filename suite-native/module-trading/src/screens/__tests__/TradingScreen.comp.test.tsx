import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import { PreloadedState, renderWithStoreProviderAsync, screen } from '@suite-native/test-utils';

import { TradingScreen } from '../TradingScreen';

jest.mock('@trezor/react-utils', () => ({
    ...jest.requireActual('@trezor/react-utils'),
    useTimer: () => ({
        timeSpent: {
            seconds: 0,
        },
        resetCount: 0,
        isStopped: false,
        isLoading: false,
        stop: () => {},
        reset: () => {},
        loading: () => {},
    }),
}));

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

describe('TradingScreen', () => {
    const renderTradingScreen = (preloadedState?: PreloadedState) =>
        renderWithStoreProviderAsync(<TradingScreen />, { preloadedState });

    const expectBuyForm = () => {
        expect(screen.getByText('You pay')).toBeOnTheScreen();
    };

    it('should render nothing when trading feature flag is not enabled', async () => {
        const { toJSON } = await renderTradingScreen(stateWithDisabledTrading);

        expect(toJSON()).toBeNull();
    });

    it('should render Buy form by default', async () => {
        await renderTradingScreen(stateWithEnabledBuy);

        expectBuyForm();
    });
});
