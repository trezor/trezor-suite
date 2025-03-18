import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import { PreloadedState, fireEvent, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { AppTabNavigator } from '../AppTabNavigator';

describe('AppTabNavigator', () => {
    const renderTabs = (preloadedState?: PreloadedState) =>
        renderWithStoreProviderAsync(<AppTabNavigator />, { preloadedState });

    it('should render 3 buttons', async () => {
        const { getByText } = await renderTabs();

        expect(getByText('Home')).toBeDefined();
        expect(getByText('My assets')).toBeDefined();
        expect(getByText('Settings')).toBeDefined();
    });

    it('should not render Trade tab when IsTradingEnabled is false', async () => {
        const { queryByText } = await renderTabs({
            featureFlags: {
                ...featureFlagsInitialState,
                [FeatureFlag.IsTradingEnabled]: false,
            },
        });

        expect(queryByText('Trade')).toBe(null);
    });

    it('should render Trade tab when IsTradingEnabled is true', async () => {
        const { getByText, getAllByText } = await renderTabs({
            featureFlags: {
                ...featureFlagsInitialState,
                [FeatureFlag.IsTradingEnabled]: true,
            },
        });

        const tradeTab = getByText('Trade');
        fireEvent.press(tradeTab);

        expect(getAllByText('Buy').length).toBe(2);
    });
});
