import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';
import { type NetworkModuleRepositoryDep } from '@suite-common/networks';
import { mockNetworkModuleRepository } from '@suite-common/networks/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { getTranslation } from '@suite-native/intl';

import { TradingScreen } from './TradingScreen';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    createTradingFeatureFlags,
    renderWithTradingProvider,
} from '../test-utils/tradingTestUtils';

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

jest.mock('../hooks/buy/useBuyData', () => ({
    useBuyData: () => ({
        isLoading: false,
        lastLoadedTimestamp: 1,
        isFullyLoaded: true,
    }),
}));

jest.mock('../hooks/exchange/useExchangeData', () => ({
    useExchangeData: () => ({
        isLoading: false,
        lastLoadedTimestamp: 1,
        isFullyLoaded: true,
    }),
}));

jest.mock('../components/concierge/ConciergeAlert', () => ({
    ConciergeAlert: () => null,
}));

const overridesWithDisabledTrading: PreloadedStatePartial<TradingTestPreloadedState> = {
    messageSystem: mockMessageSystemStateWithFeatureFlags({
        'trading.buy': false,
        'trading.exchange': false,
        'trading.sell': false,
        'trading.concierge': false,
    }),
};
const services: NativeAnalyticsDep & NetworkModuleRepositoryDep = {
    analytics: mockNativeAnalytics(),
    networkModuleRepository: mockNetworkModuleRepository(),
};

describe('TradingScreen', () => {
    let unmount: (() => void) | undefined;

    const renderTradingScreen = async (
        overrides?: PreloadedStatePartial<TradingTestPreloadedState>,
    ) => {
        const result = await renderWithTradingProvider(<TradingScreen />, { overrides, services });

        ({ unmount } = result);

        return result;
    };

    afterEach(async () => {
        if (unmount) {
            await unmount();
            unmount = undefined;
        }
    });

    it('should render nothing when trading feature flag is not enabled', async () => {
        const { toJSON } = await renderTradingScreen(overridesWithDisabledTrading);

        expect(toJSON()).toBeNull();
    });

    it('should render Buy form by default', async () => {
        const { getByText } = await renderTradingScreen({
            featureFlags: createTradingFeatureFlags({}),
        });

        expect(
            getByText(getTranslation('moduleTrading.selectFiat.buy.amountLabel')),
        ).toBeOnTheScreen();
    });
});
