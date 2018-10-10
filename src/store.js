/* @flow */

import { createStore, applyMiddleware, compose } from 'redux';
import { routerMiddleware } from 'react-router-redux';
import thunk from 'redux-thunk';
import createHistory from 'history/createHashHistory';
import { createLogger } from 'redux-logger';
import reducers from 'reducers';
import services from 'services';

import Raven from 'raven-js';
import RavenMiddleware from 'redux-raven-middleware';

import type { Action, GetState } from 'flowtype';

export const history: History = createHistory({ queryKey: false });

const initialState: any = {};
const enhancers = [];

const middlewares = [
    thunk,
    routerMiddleware(history),
];

// sentry io middleware only in dev build
if (process.env.BUILD === 'development') {
    const RAVEN_KEY = 'https://34b8c09deb6c4cd2a4dc3f0029cd02d8@sentry.io/1279550';
    const ravenMiddleware = RavenMiddleware(RAVEN_KEY);
    Raven.config(RAVEN_KEY).install();
    middlewares.push(ravenMiddleware);
}

let composedEnhancers: any;
if (process.env.NODE_ENV === 'development') {
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

    if (window && typeof window.devToolsExtension === 'function') {
        enhancers.push(window.devToolsExtension());
    }

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
    reducers,
    initialState,
    composedEnhancers,
);
