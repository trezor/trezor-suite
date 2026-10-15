import { type Store } from '@reduxjs/toolkit';

import { type PostOnboardingInit } from '@suite-native/app-init';
import { HomeStackRoutes, RootStackRoutes } from '@suite-native/navigation';
import {
    type SettingsSliceRootState,
    appSettingsReducer,
    setIsOnboardingFinished,
} from '@suite-native/settings';
import {
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { mock } from '@trezor/dependency-injection';

import { useExitOnboardingFlow } from './useExitOnboardingFlow';

const mockNavigationDispatch = jest.fn();
const mockPostOnboardingInit = mock<PostOnboardingInit>();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        dispatch: mockNavigationDispatch,
    }),
}));

describe('useExitOnboardingFlow', () => {
    let store: Store<SettingsSliceRootState>;

    const renderUseExitOnboardingFlow = async () =>
        await renderHookWithStoreProvider(() => useExitOnboardingFlow(), {
            services: { store, postOnboardingInit: mockPostOnboardingInit },
        });

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

    it('should set onboarding flag and navigate', async () => {
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = await renderUseExitOnboardingFlow();

        // call the returned callback
        await act(() => {
            result.current();
        });

        // assert that onboarding finished action was dispatched
        expect(dispatchSpy).toHaveBeenCalledWith(setIsOnboardingFinished());
        expect(mockPostOnboardingInit).toHaveBeenCalledTimes(1);

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
