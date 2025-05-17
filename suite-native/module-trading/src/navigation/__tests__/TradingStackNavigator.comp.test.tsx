import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import { renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { TradingStackNavigator } from '../TradingStackNavigator';

jest.mock('../../hooks/buy/useBuyData', () => ({
    useTradingBuyData: () => ({
        isLoading: true,
        lastLoadedTimestamp: 0,
        isFullyLoaded: false,
    }),
}));

describe('TradingStackNavigator', () => {
    it('should render', async () => {
        const { getByTestId } = await renderWithStoreProviderAsync(<TradingStackNavigator />, {
            preloadedState: {
                featureFlags: {
                    ...featureFlagsInitialState,
                    [FeatureFlag.IsTradingBuyEnabled]: true,
                },
            },
        });

        expect(getByTestId('@screen/Trading')).toBeTruthy();
    });
});
