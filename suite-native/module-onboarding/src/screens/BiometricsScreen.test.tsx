import { type Store } from '@reduxjs/toolkit';

import {
    type MessageSystemRootState,
    messageSystemInitialState,
} from '@suite-common/message-system';
import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';
import { type FeatureFlagsRootState, featureFlagsReducer } from '@suite-native/feature-flags';
import { getTranslation } from '@suite-native/intl';
import { OnboardingStackRoutes } from '@suite-native/navigation';
import { type PostOnboardingInit, type PostOnboardingInitDep } from '@suite-native/services';
import {
    createLightStore,
    createStaticReducer,
    renderWithStoreProvider,
    userEvent,
} from '@suite-native/test-utils-store';
import { mock } from '@trezor/dependency-injection';

import { BiometricsScreen, type BiometricsScreenProps } from './BiometricsScreen';

type State = FeatureFlagsRootState & MessageSystemRootState;

const mockNavigate = jest.fn();
const mockNavigationDispatch = jest.fn();
const mockRoute = {
    key: 'BiometricsScreen',
    name: OnboardingStackRoutes.Biometrics,
    params: undefined,
} as const;

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: mockNavigate,
        dispatch: mockNavigationDispatch,
    }),
    useRoute: () => mockRoute,
}));

describe('BiometricsScreen', () => {
    let store: Store<State>;
    const services: PostOnboardingInitDep = { postOnboardingInit: mock<PostOnboardingInit>() };

    const renderBiometricsScreen = () =>
        renderWithStoreProvider(
            <BiometricsScreen
                navigation={
                    { navigate: mockNavigate } as unknown as BiometricsScreenProps['navigation']
                }
                route={mockRoute}
            />,
            { services: { store, ...services } },
        );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should redirect to TradingLocation screen on Skip press when residence check message is enabled', async () => {
        store = createLightStore({
            reducer: {
                featureFlags: featureFlagsReducer,
                locale: createStaticReducer({
                    appLocaleCode: 'en-US',
                    systemLocaleCode: 'en-US',
                    isSystemLocaleUsed: true,
                }),
                messageSystem: createStaticReducer(
                    mockMessageSystemStateWithFeatureFlags({
                        'trading.restrictions.residenceWhitelistRequired': true,
                    }),
                ),
                wallet: createStaticReducer({
                    settings: {
                        localCurrency: 'usd',
                        bitcoinAmountUnit: 0,
                    },
                }),
            },
        });
        const { getByText } = await renderBiometricsScreen();

        await userEvent.press(
            getByText(getTranslation('moduleOnboarding.biometricsScreen.button.notNow')),
        );

        expect(mockNavigate).toHaveBeenCalledWith(OnboardingStackRoutes.TradingLocation);
        expect(services.postOnboardingInit).not.toHaveBeenCalled();
    });

    it('should redirect to Home screen on Skip press when the region is restricted', async () => {
        store = createLightStore({
            reducer: {
                featureFlags: featureFlagsReducer,
                locale: createStaticReducer({
                    appLocaleCode: 'en-US',
                    systemLocaleCode: 'en-US',
                    isSystemLocaleUsed: true,
                }),
                messageSystem: createStaticReducer(
                    mockMessageSystemStateWithFeatureFlags(
                        {
                            'trading.restrictions.residenceWhitelistRequired': true,
                            'regions.presenceRestriction': true,
                        },
                        { 'regions.presenceRestriction': { countries: ['US'] } },
                    ),
                ),
                wallet: createStaticReducer({
                    settings: {
                        localCurrency: 'usd',
                        bitcoinAmountUnit: 0,
                    },
                }),
            },
        });
        const { getByText } = await renderBiometricsScreen();

        await userEvent.press(
            getByText(getTranslation('moduleOnboarding.biometricsScreen.button.notNow')),
        );

        expect(mockNavigate).not.toHaveBeenCalledWith(OnboardingStackRoutes.TradingLocation);
        expect(services.postOnboardingInit).toHaveBeenCalledTimes(1);
        expect(mockNavigationDispatch).toHaveBeenCalledWith({
            payload: { index: 0, routes: [{ name: 'AppTabs', params: { screen: 'Home' } }] },
            type: 'RESET',
        });
    });

    it('should redirect to Home screen on Skip press when residence check message is absent', async () => {
        store = createLightStore({
            reducer: {
                featureFlags: featureFlagsReducer,
                locale: createStaticReducer({
                    appLocaleCode: 'en-US',
                    systemLocaleCode: 'en-US',
                    isSystemLocaleUsed: true,
                }),
                messageSystem: createStaticReducer(messageSystemInitialState),
                wallet: createStaticReducer({
                    settings: {
                        localCurrency: 'usd',
                        bitcoinAmountUnit: 0,
                    },
                }),
            },
        });
        const { getByText } = await renderBiometricsScreen();

        await userEvent.press(
            getByText(getTranslation('moduleOnboarding.biometricsScreen.button.notNow')),
        );

        expect(services.postOnboardingInit).toHaveBeenCalledTimes(1);
        expect(mockNavigationDispatch).toHaveBeenCalledWith({
            payload: { index: 0, routes: [{ name: 'AppTabs', params: { screen: 'Home' } }] },
            type: 'RESET',
        });
    });
});
