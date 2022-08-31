import { configureStore, Store, Middleware } from '@reduxjs/toolkit';
import createDebugger from 'redux-flipper';

import { appSettingsReducer } from '@suite-native/module-settings';
import { appGraphReducer } from '@suite-native/home-graph';
import { onboardingReducer } from '@suite-native/module-onboarding';

import { extraDependencies } from './extraDependencies';

const middlewares: Middleware[] = [];

if (__DEV__) {
    const reduxFlipperDebugger = createDebugger();
    middlewares.push(reduxFlipperDebugger);
}

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
        }).concat(middlewares),
});

export type RootState = ReturnType<typeof store.getState>;
