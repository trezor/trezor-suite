/* @flow */

import { createStore, applyMiddleware, compose } from 'redux';
import { routerMiddleware } from 'connected-react-router';
import thunk from 'redux-thunk';
import createHistory from 'history/createHashHistory';
import { createLogger } from 'redux-logger';
import createRootReducer from 'reducers';
import services from 'services';

import Raven from 'raven-js';
import RavenMiddleware from 'redux-raven-middleware';
import * as buildUtils from 'utils/build';

import type { Action, GetState } from 'flowtype';

export const history: History = createHistory({ queryKey: false });

const initialState: any = {};
const enhancers = [];

const middlewares = [
    thunk,
    routerMiddleware(history),
];

// sentry io middleware only in dev and beta build
if (buildUtils.isDev() || buildUtils.isBeta()) {
    const RAVEN_KEY = 'https://34b8c09deb6c4cd2a4dc3f0029cd02d8@sentry.io/1279550';
    const ravenMiddleware = RavenMiddleware(RAVEN_KEY);
    Raven.config(RAVEN_KEY).install();
    middlewares.push(ravenMiddleware);
}

let composedEnhancers: any;
if (buildUtils.isDev()) {
    const excludeLogger = (getState: GetState, action: Action): boolean => {
        //'@@router/LOCATION_CHANGE'
        const excluded: Array<?string> = ['LOG_TO_EXCLUDE', 'log__add', undefined];
        const pass: Array<?string> = excluded.filter(act => action.type === act);
        return pass.length === 0;
    };

    const logger = createLogger({
        level: 'info',
        predicate: excludeLogger,
        collapsed: true,
    });

    /* eslint-disable no-underscore-dangle */
    if (window && typeof window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ === 'function') {
        enhancers.push(window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__());
    }
    /* eslint-enable */

    composedEnhancers = compose(
        applyMiddleware(logger, ...middlewares, ...services),
        ...enhancers,
    );
} else {
    composedEnhancers = compose(
        applyMiddleware(...middlewares, ...services),
        ...enhancers,
    );
}

export default createStore(
    createRootReducer(history),
    initialState,
    composedEnhancers,
);
