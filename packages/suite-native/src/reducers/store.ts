import { createStore, applyMiddleware, combineReducers, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';

import suiteReducers from '@suite-reducers/index';
import suiteMiddlewares from '@suite-middlewares/index';

import walletReducers from '@wallet-reducers/index';
import walletMiddlewares from '@wallet-middlewares/index';

const reducers = combineReducers(suiteReducers);
export type State = ReturnType<typeof reducers>;

const middlewares = [thunkMiddleware, ...suiteMiddlewares, ...walletMiddlewares, ...walletReducers];

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

const composedEnhancers = compose(
    applyMiddleware(logger, ...middlewares),
    ...enhancers,
);

export const initStore = () => {
    return createStore(reducers, composedEnhancers);
};
