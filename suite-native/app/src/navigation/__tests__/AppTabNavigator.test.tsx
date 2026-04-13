import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import {
    type PreloadedState,
    act,
    fireEvent,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';

import { AppTabNavigator } from '../AppTabNavigator';

jest.mock('@suite-common/tx-simulation', () => ({}));

describe('AppTabNavigator', () => {
    const renderTabs = (preloadedState?: PreloadedState) =>
        renderWithStoreProvider(<AppTabNavigator />, { preloadedState });

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
            messageSystem: {
                validMessages: {
                    banner: [],
                    context: [],
                    modal: [],
                    feature: ['actionId'],
                },
                dismissedMessages: [],
                config: {
                    actions: [
                        {
                            message: {
                                id: 'actionId',
                                category: ['feature'],
                                feature: [
                                    {
                                        domain: 'trading.buy',
                                        flag: false,
                                    },
                                    {
                                        domain: 'trading.exchange',
                                        flag: false,
                                    },
                                    {
                                        domain: 'trading.sell',
                                        flag: false,
                                    },
                                ],
                            },
                        },
                    ],
                },
            },
        } as unknown as PreloadedState);

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
