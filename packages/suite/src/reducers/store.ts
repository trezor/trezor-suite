import { createStore, applyMiddleware, combineReducers, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';

import * as buildUtils from '@suite-utils/build';
import suiteMiddlewares from '@suite-middlewares';
import walletMiddlewares from '@wallet-middlewares';
import onboardingMiddlewares from '@onboarding-middlewares';
import firmwareMiddlewares from '@firmware-middlewares';
import backupMiddlewares from '@backup-middlewares';
import recoveryMiddlewares from '@recovery-middlewares';

import suiteReducers from '@suite-reducers';
import walletReducers from '@wallet-reducers';
import onboardingReducers from '@onboarding-reducers';
import settingsReducers from '@settings-reducers';
import firmwareReducers from '@firmware-reducers';
import backupReducers from '@backup-reducers';

const rootReducer = combineReducers({
    ...suiteReducers,
    onboarding: onboardingReducers,
    wallet: walletReducers,
    settings: settingsReducers,
    firmware: firmwareReducers,
    backup: backupReducers,
});

export type AppState = ReturnType<typeof rootReducer>;

const middlewares = [
    thunkMiddleware,
    ...suiteMiddlewares,
    ...walletMiddlewares,
    ...onboardingMiddlewares,
    ...firmwareMiddlewares,
    ...backupMiddlewares,
    ...recoveryMiddlewares,
];

const enhancers: any[] = [];
if (buildUtils.isDev()) {
    const excludeLogger = (_getState: any, action: any): boolean => {
        // '@@router/LOCATION_CHANGE'
        const excluded = ['LOG_TO_EXCLUDE', 'log__add', undefined];
        const pass = excluded.filter(act => action.type === act);
        return pass.length === 0;
    };

    const logger = createLogger({
        level: 'info',
        predicate: excludeLogger,
        collapsed: true,
    });
    middlewares.push(logger);

    /* eslint-disable no-underscore-dangle */
    if (
        typeof window !== 'undefined' &&
        typeof (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ === 'function'
    ) {
        enhancers.push((window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__());
    }
    /* eslint-enable no-underscore-dangle */
}

const composedEnhancers = compose(applyMiddleware(...middlewares), ...enhancers);

export const initStore = () => {
    return createStore(rootReducer, composedEnhancers);
};
