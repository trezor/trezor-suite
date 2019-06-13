import { createStore, applyMiddleware, combineReducers, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';

import commonReducers from '@suite-reducers/index';
import commonMiddlewares from '@suite/middlewares';

const reducers = combineReducers(commonReducers);
export type State = ReturnType<typeof reducers>;

const middlewares = [thunkMiddleware, ...commonMiddlewares];

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
