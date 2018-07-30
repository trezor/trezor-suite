/* @flow */


import { createStore, applyMiddleware, compose } from 'redux';
import { routerMiddleware, push } from 'react-router-redux';
import thunk from 'redux-thunk';
// import createHistory from 'history/createBrowserHistory';
// import { useRouterHistory } from 'react-router';
import createHistory from 'history/createHashHistory';
import { createLogger } from 'redux-logger';
import reducers from '../reducers';
import services from '../services';

import Raven from 'raven-js';
import RavenMiddleware from 'redux-raven-middleware';

import type { Action, GetState, Store } from '~/flowtype';

export const history: History = createHistory({ queryKey: false });

const RAVEN_KEY: string = 'https://497392c3ff6e46dc9e54eef123979378@sentry.io/294339';
Raven.config(RAVEN_KEY).install();

const initialState: any = {};
const enhancers = [];
const middleware = [
    thunk,
    RavenMiddleware(RAVEN_KEY),
    routerMiddleware(history),
];


let composedEnhancers: any;
if (process.env.NODE_ENV === 'development') {
    const excludeLogger = (getState: GetState, action: Action): boolean => {
        //'@@router/LOCATION_CHANGE'
        const excluded: Array<string> = ['LOG_TO_EXCLUDE', 'log__add'];
        const pass: Array<string> = excluded.filter(act => action.type === act);
        return pass.length === 0;
    };

    const logger = createLogger({
        level: 'info',
        predicate: excludeLogger,
        collapsed: true,
    });

    const devToolsExtension: ?Function = window.devToolsExtension;
    if (typeof devToolsExtension === 'function') {
        enhancers.push(devToolsExtension());
    }

    composedEnhancers = compose(
        applyMiddleware(...middleware, logger, ...services),
        ...enhancers,
    );
} else {
    composedEnhancers = compose(
        applyMiddleware(...middleware, ...services),
        ...enhancers,
    );
}

export default createStore(
    reducers,
    initialState,
    composedEnhancers,
);

// if (process.env.NODE_ENV === 'production') {
//     module.exports = require('./store.dev'); // eslint-disable-line global-require
// } else {
//     module.exports = require('./store.dev'); // eslint-disable-line global-require
// }