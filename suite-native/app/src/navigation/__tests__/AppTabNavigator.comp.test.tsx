import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import { PreloadedState, fireEvent, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { AppTabNavigator } from '../AppTabNavigator';

describe('AppTabNavigator', () => {
    const renderTabs = (preloadedState?: PreloadedState) =>
        renderWithStoreProviderAsync(<AppTabNavigator />, { preloadedState });

    beforeEach(() => {
        global.fetch = jest.fn().mockResolvedValue({
            json: jest.fn().mockResolvedValue({}),
            ok: true,
        });
    });

    it('should render 3 buttons', async () => {
        const { getByText } = await renderTabs();

        expect(getByText('Home')).toBeTruthy();
        expect(getByText('My assets')).toBeTruthy();
        expect(getByText('Settings')).toBeTruthy();
    });

    it('should not render Trade tab when all trading flags are disabled', async () => {
        const { queryByText } = await renderTabs({
            featureFlags: {
                ...featureFlagsInitialState,
                [FeatureFlag.IsTradingBuyEnabled]: false,
                [FeatureFlag.IsTradingSwapEnabled]: false,
                [FeatureFlag.IsTradingSellEnabled]: false,
            },
        });

        expect(queryByText('Trade')).toBe(null);
    });

    it('should render Trade tab when at least one trading flag is enabled', async () => {
        const { getByText, getByTestId } = await renderTabs({
            featureFlags: {
                ...featureFlagsInitialState,
                [FeatureFlag.IsTradingBuyEnabled]: true,
            },
        });

        const tradeTab = getByText('Trade');
        fireEvent.press(tradeTab);

        expect(getByTestId('@screen/Trading')).toBeTruthy();
    });
});
