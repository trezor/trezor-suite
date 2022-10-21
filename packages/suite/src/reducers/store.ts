import { configureStore, combineReducers } from '@reduxjs/toolkit';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';

import suiteMiddlewares from '@suite-middlewares';
import walletMiddlewares from '@wallet-middlewares';
import onboardingMiddlewares from '@onboarding-middlewares';
import firmwareMiddlewares from '@firmware-middlewares';
import backupMiddlewares from '@backup-middlewares';
import recoveryMiddlewares from '@recovery-middlewares';

import suiteReducers from '@suite-reducers';
import walletReducers from '@wallet-reducers';
import onboardingReducers from '@onboarding-reducers';
import recoveryReducers from '@recovery-reducers';
import firmwareReducers from '@firmware-reducers';
import backupReducers from '@backup-reducers';
import { desktopReducer } from './desktop';

// toastMiddleware can be used only in suite-desktop and suite-web
// it's not included into `@suite-middlewares` index
import toastMiddleware from '@suite-middlewares/toastMiddleware';
import type { PreloadStoreAction } from '@suite-support/preloadStore';
import { extraDependencies } from '../support/extraDependencies';

const rootReducer = combineReducers({
    ...suiteReducers,
    onboarding: onboardingReducers,
    wallet: walletReducers,
    recovery: recoveryReducers,
    firmware: firmwareReducers,
    backup: backupReducers,
    desktop: desktopReducer,
});

export type AppState = ReturnType<typeof rootReducer>;

const middleware = [
    thunkMiddleware.withExtraArgument(extraDependencies),
    toastMiddleware,
    ...suiteMiddlewares,
    ...walletMiddlewares,
    ...onboardingMiddlewares,
    ...firmwareMiddlewares,
    ...backupMiddlewares,
    ...recoveryMiddlewares,
];

const excludedActions = ['@log/add', '@coinjoin/client-log'];

if (!process.env.CODESIGN_BUILD) {
    const excludeLogger = (_getState: any, action: any): boolean => {
        const pass = excludedActions.filter(act => action.type === act);
        return pass.length === 0;
    };

    const logger = createLogger({
        level: 'info',
        predicate: excludeLogger,
        collapsed: true,
    });
    middleware.push(logger);
}

const devTools =
    typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
        ? {
              actionsBlacklist: excludedActions,
          }
        : false;

export const initStore = (preloadStoreAction?: PreloadStoreAction) => {
    // get initial state by calling STORAGE.LOAD action with optional payload
    // payload will be processed in each reducer explicitly
    const preloadedState = preloadStoreAction
        ? rootReducer(undefined, preloadStoreAction)
        : undefined;

    return configureStore({
        reducer: rootReducer,
        preloadedState,
        middleware,
        devTools,
    });
};
