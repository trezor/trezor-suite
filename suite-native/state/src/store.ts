import { configureStore, Store } from '@reduxjs/toolkit';

import { appSettingsReducer } from '@suite-native/module-settings';
import { appGraphReducer } from '@suite-native/home-graph';
import { onboardingReducer } from '@suite-native/module-onboarding';

import { extraDependencies } from './extraDependencies';

export const store: Store = configureStore({
    reducer: {
        onboarding: onboardingReducer,
        appSettings: appSettingsReducer,
        appGraph: appGraphReducer,
    },
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
            thunk: {
                extraArgument: extraDependencies,
            },
        }),
});

export type RootState = ReturnType<typeof store.getState>;
