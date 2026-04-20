import { messageSystemStateWithFeatureFlags } from '@suite-common/message-system';
import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import { act, fireEvent, renderWithStoreProvider } from '@suite-native/test-utils-store';

import { AppTabNavigator } from '../AppTabNavigator';

jest.mock('@suite-common/tx-simulation', () => ({}));

const defaultPreloadedState = {
    featureFlags: featureFlagsInitialState,
    bluetooth: { permissionStatus: 'unavailable' },
    device: { selectedDevice: undefined, devices: [], persistentDeviceData: {} },
    wallet: {
        accounts: [],
        trading: { residence: { country: null, wasOnboardingVisited: false } },
    },
    appSettings: { shouldShowAutoEjectAlert: false, hasAutoEjectAlertBeenDisplayed: false },
    messageSystem: {
        config: { actions: [] },
        validMessages: { banner: [], context: [], modal: [], feature: [] },
        dismissedMessages: [],
    },
};

describe('AppTabNavigator', () => {
    const renderTabs = (preloadedState?: Record<string, unknown>) =>
        renderWithStoreProvider(<AppTabNavigator />, {
            preloadedState: { ...defaultPreloadedState, ...preloadedState },
        });

    beforeEach(() => {
        global.fetch = jest.fn().mockResolvedValue({
            json: jest.fn().mockResolvedValue({}),
            ok: true,
        });
    });

    it('should render 3 buttons', () => {
        const { getByText } = renderTabs();

        expect(getByText('Home')).toBeTruthy();
        expect(getByText('My assets')).toBeTruthy();
        expect(getByText('Settings')).toBeTruthy();
    });

    it('should not render Trade tab when all trading flags are disabled', () => {
        const { queryByText } = renderTabs({
            featureFlags: {
                ...featureFlagsInitialState,
                [FeatureFlag.IsTradingBuyEnabled]: false,
                [FeatureFlag.IsTradingExchangeEnabled]: false,
                [FeatureFlag.IsTradingSellEnabled]: false,
                [FeatureFlag.IsTradingResidenceCheckEnabled]: false,
            },
            messageSystem: messageSystemStateWithFeatureFlags({
                'trading.buy': false,
                'trading.exchange': false,
                'trading.sell': false,
            }),
        });

        expect(queryByText('Trade')).toBe(null);
    });

    it('should render Trade tab when at least one trading flag is enabled', async () => {
        const { getByText, getByTestId } = renderTabs({
            featureFlags: {
                ...featureFlagsInitialState,
                [FeatureFlag.IsTradingBuyEnabled]: true,
                [FeatureFlag.IsTradingResidenceCheckEnabled]: false,
            },
        });

        const tradeTab = getByText('Trade');
        await act(async () => {
            fireEvent.press(tradeTab);
            await Promise.resolve();
        });

        expect(getByTestId('@screen/Trading')).toBeTruthy();
    });

    it('should render Earn tab', () => {
        const { queryByText } = renderTabs();

        expect(queryByText('Earn')).toBeTruthy();
    });
});
