import { createStore, applyMiddleware, combineReducers, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';

import commonReducers from './common';
import onboardingReducers from './onboarding';
import commonMiddlewares from '../middlewares';

const reducers = combineReducers({ ...commonReducers, onboarding: onboardingReducers });
export type State = ReturnType<typeof reducers>;

const middlewares = [thunkMiddleware, ...commonMiddlewares];

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
    return createStore(reducers, composedEnhancers);
};
