/* @flow */
'use strict';

import { createStore, applyMiddleware, compose } from 'redux';
import { routerMiddleware, push } from 'react-router-redux';
import thunk from 'redux-thunk';
// import createHistory from 'history/createBrowserHistory';
// import { useRouterHistory } from 'react-router';
import createHistory from 'history/createHashHistory';
import { createLogger } from 'redux-logger';
import reducers from '../reducers';
import services from '../services';
import RavenMiddleware from 'redux-raven-middleware';

import type { Store } from '../flowtype';

export const history = createHistory( { queryKey: false } );

const initialState: any = {};
const enhancers = [];
const middleware = [
    thunk,
    RavenMiddleware('https://497392c3ff6e46dc9e54eef123979378@sentry.io/294339'),
    routerMiddleware(history)
];

const excludeLogger = (getState: any, action: any): boolean => {
    //'@@router/LOCATION_CHANGE'
    const excluded: Array<string> = ['LOG_TO_EXCLUDE'];
    const pass: Array<string> = excluded.filter((act) => {
        return action.type === act;
    });
    return pass.length === 0;
}

const logger = createLogger({
    level: 'info',
    // predicate: excludeLogger,
    collapsed: true
});

if (process.env.NODE_ENV === 'development') {
    const devToolsExtension: ?Function = window.devToolsExtension;
    if (typeof devToolsExtension === 'function') {
        enhancers.push(devToolsExtension());
    }
}

const composedEnhancers = compose(
    // applyMiddleware(...middleware, logger, ...services),
    applyMiddleware(...middleware, logger, ...services),
    ...enhancers
);

export default createStore(
    reducers,
    initialState,
    composedEnhancers
);

// if (process.env.NODE_ENV === 'production') {
//     module.exports = require('./store.dev'); // eslint-disable-line global-require
// } else {
//     module.exports = require('./store.dev'); // eslint-disable-line global-require
// }