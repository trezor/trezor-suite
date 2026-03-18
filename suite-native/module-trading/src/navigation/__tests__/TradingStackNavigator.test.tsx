import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import { renderWithStoreProvider } from '@suite-native/test-utils';

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
        const { getByTestId } = renderWithStoreProvider(<TradingStackNavigator />, {
            preloadedState: {
                featureFlags: {
                    ...featureFlagsInitialState,
                    [FeatureFlag.IsTradingBuyEnabled]: true,
                    [FeatureFlag.IsTradingResidenceCheckEnabled]: false,
                },
            },
        });

        expect(getByTestId('@screen/Trading')).toBeTruthy();
    });
});
