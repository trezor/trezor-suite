import { HomeStackRoutes, RootStackRoutes } from '@suite-native/navigation';
import { appSettingsReducer, setIsOnboardingFinished } from '@suite-native/settings';
import {
    type TestStore,
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';

import { useExitOnboardingFlow } from '../useExitOnboardingFlow';

const mockNavigationDispatch = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        dispatch: mockNavigationDispatch,
    }),
}));

jest.mock('@suite-native/app-init', () => ({
    ...jest.requireActual('@suite-native/app-init'),
    postOnboardingInit: () => ({
        type: 'postOnboardingInitMock',
    }),
}));

describe('useExitOnboardingFlow', () => {
    let store: TestStore;

    const renderUseExitOnboardingFlow = () =>
        renderHookWithStoreProvider(() => useExitOnboardingFlow(), { store });

    beforeEach(() => {
        store = createLightStore({
            reducer: {
                appSettings: appSettingsReducer,
                locale: createStaticReducer({
                    appLocaleCode: 'en-US',
                    systemLocaleCode: 'en-US',
                    isSystemLocaleUsed: true,
                }),
                wallet: createStaticReducer({
                    settings: {
                        localCurrency: 'usd',
                        bitcoinAmountUnit: 0,
                    },
                }),
            },
        });
        jest.clearAllMocks();
    });

    it('should set onboarding flag and navigate', () => {
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = renderUseExitOnboardingFlow();

        // call the returned callback
        act(() => {
            result.current();
        });

        // assert that onboarding finished action was dispatched
        expect(dispatchSpy).toHaveBeenCalledWith(setIsOnboardingFinished());
        expect(dispatchSpy).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'postOnboardingInitMock' }),
        );

        // assert that navigation.reset was dispatched to navigate to AppTabs -> Home
        expect(mockNavigationDispatch).toHaveBeenCalledTimes(1);
        expect(mockNavigationDispatch).toHaveBeenCalledWith({
            payload: {
                index: 0,
                routes: [
                    {
                        name: RootStackRoutes.AppTabs,
                        params: { screen: HomeStackRoutes.Home },
                    },
                ],
            },
            type: 'RESET',
        });
    });
});
