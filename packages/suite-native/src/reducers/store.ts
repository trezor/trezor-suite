/**
 * Main file corresponding with @suite/reducers/store.ts
 * Differences:
 * - added 'react-navigation' reducer and middleware
 */

import { createStore, applyMiddleware, combineReducers, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';

import suiteMiddlewares from '@suite-middlewares/index';
import walletMiddlewares from '@wallet-middlewares/index';

import suiteReducers from '@suite-reducers/index';
import onboardingReducers from '@onboarding-reducers/index';
import walletReducers from '@wallet-reducers/index';

const reducers = combineReducers({
    ...suiteReducers,
    onboarding: onboardingReducers,
    wallet: walletReducers,
});

export type AppState = ReturnType<typeof reducers>;

const middlewares = [thunkMiddleware, ...suiteMiddlewares, ...walletMiddlewares];

const enhancers: any[] = [];

const excludeLogger = (_getState: any, action: any): boolean => {
    const excluded = ['LOG_TO_EXCLUDE', 'log__add', undefined];
    const pass = excluded.filter(act => action.type === act);
    return pass.length === 0;
};

const logger = createLogger({
    level: 'info',
    predicate: excludeLogger,
    collapsed: true,
});

const composedEnhancers = compose(applyMiddleware(logger, ...middlewares), ...enhancers);

export const initStore = () => {
    return createStore(reducers, composedEnhancers);
};
