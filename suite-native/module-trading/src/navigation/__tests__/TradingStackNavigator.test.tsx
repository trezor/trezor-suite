import { FeatureFlag } from '@suite-native/feature-flags';

import {
    createTradingFeatureFlags,
    renderWithTradingProvider,
} from '../../__tests__/tradingTestUtils';
import { TradingStackNavigator } from '../TradingStackNavigator';

jest.mock('../../hooks/buy/useBuyData', () => ({
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
                featureFlags: createTradingFeatureFlags({
                    [FeatureFlag.IsTradingBuyEnabled]: true,
                }),
            },
            providers: ['intl', 'navigation', 'formatter', 'bottomSheet'],
        });

        expect(getByTestId('@screen/Trading')).toBeTruthy();
    });
});
