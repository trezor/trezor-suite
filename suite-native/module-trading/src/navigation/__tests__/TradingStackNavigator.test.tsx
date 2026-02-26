import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
// eslint-disable-next-line local-rules/no-package-deep-imports
import { renderWithStoreProviderAsync } from '@suite-native/test-utils/store';

import { TradingStackNavigator } from '../TradingStackNavigator';

jest.mock('../../hooks/buy/useBuyData', () => ({
    useBuyData: () => ({
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
                    [FeatureFlag.IsTradingResidenceCheckEnabled]: false,
                },
            },
        });

        expect(getByTestId('@screen/Trading')).toBeTruthy();
    });
});
