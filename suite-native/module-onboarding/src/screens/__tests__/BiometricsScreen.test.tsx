import { OnboardingStackRoutes } from '@suite-native/navigation';
import { userEvent } from '@suite-native/test-utils';
import { type TestStore, initStore, renderWithStoreProviderAsync } from '@suite-native/test-utils/store';

import { BiometricsScreen, BiometricsScreenProps } from '../BiometricsScreen';

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
    let store: TestStore;

    const renderBiometricsScreen = () =>
        renderWithStoreProviderAsync(
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
        store = initStore({
            featureFlags: {
                isTradingResidenceCheckEnabled: true,
            },
        }).store;
        const { getByText } = await renderBiometricsScreen();

        await userEvent.press(getByText('Not now'));

        expect(mockNavigate).toHaveBeenCalledWith(OnboardingStackRoutes.TradingLocation);
    });

    it('should redirect to Home screen on Skip press when isTradingResidenceCheckEnabled is set to false', async () => {
        store = initStore({
            featureFlags: {
                isTradingResidenceCheckEnabled: false,
            },
        }).store;
        const { getByText } = await renderBiometricsScreen();

        await userEvent.press(getByText('Not now'));

        expect(mockNavigationDispatch).toHaveBeenCalledWith({
            payload: { index: 0, routes: [{ name: 'AppTabs', params: { screen: 'Home' } }] },
            type: 'RESET',
        });
    });
});
