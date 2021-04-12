/**
 * Main file corresponding with @suite/reducers/store.ts
 */

import { createStore, applyMiddleware, combineReducers, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';

import suiteMiddlewares from '@suite-middlewares/index';
import walletMiddlewares from '@wallet-middlewares/index';
import firmwareMiddlewares from '@firmware-middlewares/index';
import backupMiddlewares from '@backup-middlewares';
import recoveryMiddlewares from '@recovery-middlewares';

import suiteReducers from '@suite-reducers/index';
import onboardingReducers from '@onboarding-reducers/index';
import walletReducers from '@wallet-reducers/index';
import recoveryReducers from '@recovery-reducers/index';
import firmwareReducers from '@firmware-reducers/index';
import backupReducers from '@backup-reducers';

const reducers = combineReducers({
    ...suiteReducers,
    onboarding: onboardingReducers,
    wallet: walletReducers,
    recovery: recoveryReducers,
    firmware: firmwareReducers,
    backup: backupReducers,
});

export type AppState = ReturnType<typeof reducers>;

const middlewares = [
    thunkMiddleware,
    ...suiteMiddlewares,
    ...walletMiddlewares,
    ...firmwareMiddlewares,
    ...backupMiddlewares,
    ...recoveryMiddlewares,
];

const enhancers: any[] = [];

const excludeLogger = (_getState: any, action: any): boolean => {
    const excluded = ['@log/add', undefined];
    const pass = excluded.filter(act => action.type === act);
    return pass.length === 0;
};

const logger = createLogger({
    level: 'info',
    predicate: excludeLogger,
    collapsed: true,
});

const composedEnhancers = compose(applyMiddleware(logger, ...middlewares), ...enhancers);

export const initStore = () => createStore(reducers, composedEnhancers);
