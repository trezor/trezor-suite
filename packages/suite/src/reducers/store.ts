import { createStore, applyMiddleware, combineReducers, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';

import suiteMiddlewares from '@suite-middlewares/index';
import walletMiddlewares from '@wallet-middlewares/index';
import onboardingMiddleware from '@onboarding-middlewares/index';

import suiteReducers from '@suite-reducers/index';
import walletReducers from '@wallet-reducers/index';
import onboardingReducers from '@onboarding-reducers/index';

const rootReducer = combineReducers({
    ...suiteReducers,
    onboarding: onboardingReducers,
    wallet: walletReducers,
});

export type AppState = ReturnType<typeof rootReducer>;

const middlewares = [
    thunkMiddleware,
    ...suiteMiddlewares,
    ...walletMiddlewares,
    onboardingMiddleware,
];

const enhancers: any[] = [];

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

/* eslint-disable no-underscore-dangle */
if (
    typeof window !== 'undefined' &&
    typeof (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ === 'function'
) {
    enhancers.push((window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__());
}
/* eslint-enable no-underscore-dangle */

const composedEnhancers = compose(
    applyMiddleware(logger, ...middlewares),
    ...enhancers,
);

export const initStore = () => {
    return createStore(rootReducer, composedEnhancers);
};
