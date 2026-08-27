import { combineReducers } from '@reduxjs/toolkit';

import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { getTranslation, localeReducer } from '@suite-native/intl';
import {
    type TestStore,
    createLightStore,
    createStaticReducer,
    fireEvent,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';
import {
    residenceReducer,
    selectTradingResidenceCountry,
    selectWasTradingResidenceOnboardingVisited,
} from '@suite-native/trading-state';

import { LocationForm } from './LocationForm';
import { OnboardingButtons, type OnboardingButtonsProps } from './OnboardingButtons';

describe('OnboardingButtons', () => {
    let store: TestStore;
    const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };

    const renderOnboardingButtons = async (props: OnboardingButtonsProps) =>
        await renderWithStoreProvider(<OnboardingButtons {...props} />, {
            wrapper: LocationForm,
            services,
            store,
        });

    beforeEach(() => {
        store = createLightStore({
            reducer: {
                locale: localeReducer,
                wallet: combineReducers({
                    settings: createStaticReducer(initialWalletSettingsState),
                    trading: combineReducers({
                        residence: residenceReducer,
                    }),
                }),
            },
        });
    });

    it('should render correctly', async () => {
        const { getByText } = await renderOnboardingButtons({ afterPress: () => {} });

        expect(
            getByText(getTranslation('tradingResidence.locationSettings.confirmButton')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('tradingResidence.locationSettings.skipButton')),
        ).toBeOnTheScreen();

        // make sure preconditions are met
        expect(selectTradingResidenceCountry(store.getState())).toBeUndefined();
        expect(selectWasTradingResidenceOnboardingVisited(store.getState())).toBe(false);
    });

    it('should dispatch setResidenceCountry and setOnboardingVisited on `Confirm location` press', async () => {
        const afterPressMock = jest.fn();
        const { getByText } = await renderOnboardingButtons({ afterPress: afterPressMock });

        await fireEvent.press(
            getByText(getTranslation('tradingResidence.locationSettings.confirmButton')),
        );

        // from expo-localization mock
        expect(selectTradingResidenceCountry(store.getState())).toBe('PL');
        expect(selectWasTradingResidenceOnboardingVisited(store.getState())).toBe(true);
        expect(afterPressMock).toHaveBeenCalledTimes(1);
    });

    it('should dispatch only setOnboardingVisited on `Not now` press', async () => {
        const afterPressMock = jest.fn();
        const { getByText } = await renderOnboardingButtons({ afterPress: afterPressMock });

        await fireEvent.press(
            getByText(getTranslation('tradingResidence.locationSettings.skipButton')),
        );

        expect(selectTradingResidenceCountry(store.getState())).toBeUndefined();
        expect(selectWasTradingResidenceOnboardingVisited(store.getState())).toBe(true);
        expect(afterPressMock).toHaveBeenCalledTimes(1);
    });
});
