import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';

import { TradingStackNavigator } from './TradingStackNavigator';
import {
    createTradingFeatureFlags,
    renderWithTradingProvider,
} from '../test-utils/tradingTestUtils';

jest.mock('../hooks/buy/useBuyData', () => ({
    useBuyData: () => ({
        isLoading: true,
        lastLoadedTimestamp: 0,
        isFullyLoaded: false,
    }),
}));

describe('TradingStackNavigator', () => {
    it('should render', () => {
        const { getByTestId } = renderWithTradingProvider(<TradingStackNavigator />, {
            overrides: {
                featureFlags: createTradingFeatureFlags({}),
                messageSystem: mockMessageSystemStateWithFeatureFlags({}),
            },
        });

        expect(getByTestId('@screen/Trading')).toBeTruthy();
    });

    it('should not render when all feature flags are disabled', () => {
        const { queryByTestId } = renderWithTradingProvider(<TradingStackNavigator />, {
            overrides: {
                featureFlags: createTradingFeatureFlags({}),
                messageSystem: mockMessageSystemStateWithFeatureFlags({
                    'trading.buy': false,
                    'trading.exchange': false,
                    'trading.sell': false,
                    'trading.concierge': false,
                }),
            },
        });

        expect(queryByTestId('@screen/Trading')).toBeFalsy();
    });
});
