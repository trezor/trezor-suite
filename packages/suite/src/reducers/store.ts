import { createStore, applyMiddleware, combineReducers, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';
import * as asyncInitialState from 'redux-async-initial-state';

import commonReducers from './common';

const combined = combineReducers({
    ...commonReducers,
    storage: asyncInitialState.innerReducer,
});
const reducers = asyncInitialState.outerReducer<typeof combined>(combined);
export type State = ReturnType<typeof reducers>;

const loadStore = (getState: () => State): Promise<State> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                ...getState(),
                suite: {
                    ready: true,
                },
            });
        }, 5000);
    });
};

const middlewares = [thunkMiddleware, asyncInitialState.middleware(loadStore)];

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
    typeof window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ === 'function'
) {
    enhancers.push(window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__());
}
/* eslint-enable no-underscore-dangle */

const composedEnhancers = compose(
    applyMiddleware(logger, ...middlewares),
    ...enhancers,
);

export const initStore = () => {
    return createStore(reducers, composedEnhancers);
};
