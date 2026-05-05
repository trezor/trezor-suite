import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';
import { FeatureFlag } from '@suite-native/feature-flags';
import { screen } from '@suite-native/test-utils-store';

import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    createTradingFeatureFlags,
    renderWithTradingProvider,
} from '../../__tests__/tradingTestUtils';
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

jest.mock('../../components/concierge/ConciergeAlert', () => ({
    ConciergeAlert: () => null,
}));

const overridesWithEnabledBuy: PreloadedStatePartial<TradingTestPreloadedState> = {
    featureFlags: createTradingFeatureFlags({
        [FeatureFlag.IsTradingBuyEnabled]: true,
    }),
};

const overridesWithDisabledTrading: PreloadedStatePartial<TradingTestPreloadedState> = {
    featureFlags: createTradingFeatureFlags({
        [FeatureFlag.IsTradingBuyEnabled]: false,
        [FeatureFlag.IsTradingExchangeEnabled]: false,
        [FeatureFlag.IsTradingSellEnabled]: false,
    }),
    messageSystem: mockMessageSystemStateWithFeatureFlags({
        'trading.buy': false,
        'trading.exchange': false,
        'trading.sell': false,
    }),
};

describe('TradingScreen', () => {
    let unmount: (() => void) | undefined;

    const renderTradingScreen = (overrides?: PreloadedStatePartial<TradingTestPreloadedState>) => {
        const result = renderWithTradingProvider(<TradingScreen />, { overrides });

        ({ unmount } = result);

        return result;
    };

    afterEach(() => {
        if (unmount) {
            unmount();
            unmount = undefined;
        }
    });

    it('should render nothing when trading feature flag is not enabled', () => {
        const { toJSON } = renderTradingScreen(overridesWithDisabledTrading);

        expect(toJSON()).toBeNull();
    });

    it('should render Buy form by default', () => {
        renderTradingScreen(overridesWithEnabledBuy);

        expect(screen.getByText('You pay')).toBeOnTheScreen();
    });
});
