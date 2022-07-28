import { configureStore, Store } from '@reduxjs/toolkit';

import { appSettingsReducer } from '@suite-native/module-settings';
import { appGraphReducer } from '@suite-native/home-graph';
import { appOnboardingReducer } from '@suite-native/module-onboarding';

export const store: Store = configureStore({
    reducer: {
        appOnboarding: appOnboardingReducer,
        appSettings: appSettingsReducer,
        appGraph: appGraphReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
