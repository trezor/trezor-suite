import { messageSystemInitialState } from '@suite-common/message-system';
import { featureFlagsReducer } from '@suite-native/feature-flags';
import { OnboardingStackRoutes } from '@suite-native/navigation';
import {
    type TestStore,
    createLightStore,
    createStaticReducer,
    renderWithStoreProvider,
    userEvent,
} from '@suite-native/test-utils-store';

import { BiometricsScreen, type BiometricsScreenProps } from '../BiometricsScreen';

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

// Stub out postOnboardingInit so exiting the onboarding flow does not dispatch
// initStakeDataThunk, which calls up-fetch and throws in the jsdom test env
// because the global Request constructor is not available.
jest.mock('@suite-native/app-init', () => ({
    ...jest.requireActual('@suite-native/app-init'),
    postOnboardingInit: () => ({
        type: 'postOnboardingInitMock',
    }),
}));

describe('BiometricsScreen', () => {
    let store: TestStore;

    const renderBiometricsScreen = () =>
        renderWithStoreProvider(
            <BiometricsScreen
                navigation={
                    { navigate: mockNavigate } as unknown as BiometricsScreenProps['navigation']
                }
                route={mockRoute}
            />,
            { store },
        );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should redirect to TradingLocation screen on Skip press when isTradingResidenceCheckEnabled is set to true', async () => {
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
            preloadedState: {
                featureFlags: {
                    isTradingResidenceCheckEnabled: true,
                },
            },
        });
        const { getByText } = renderBiometricsScreen();

        await userEvent.press(getByText('Not now'));

        expect(mockNavigate).toHaveBeenCalledWith(OnboardingStackRoutes.TradingLocation);
    });

    it('should redirect to Home screen on Skip press when isTradingResidenceCheckEnabled is set to false', async () => {
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
            preloadedState: {
                featureFlags: {
                    isTradingResidenceCheckEnabled: false,
                },
            },
        });
        const { getByText } = renderBiometricsScreen();

        await userEvent.press(getByText('Not now'));

        expect(mockNavigationDispatch).toHaveBeenCalledWith({
            payload: { index: 0, routes: [{ name: 'AppTabs', params: { screen: 'Home' } }] },
            type: 'RESET',
        });
    });
});
