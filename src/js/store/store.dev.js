/* @flow */
'use strict';

import { createStore, applyMiddleware, compose } from 'redux';
import { syncHistoryWithStore, routerMiddleware, push } from 'react-router-redux';
import thunk from 'redux-thunk';
// import createHistory from 'history/createBrowserHistory';
// import { useRouterHistory } from 'react-router';
import createHistory from 'history/createHashHistory';
import { createLogger } from 'redux-logger';
import reducers from '../reducers';
import services from '../services';
import { Middleware } from 'redux';
import { GenericStoreEnhancer } from 'redux';

export const history = createHistory( { queryKey: false } );

const initialState: any = {};
const enhancers = [];
const middleware = [
    thunk,
    routerMiddleware(history)
];

const excludeLogger = (getState: any, action: any): boolean => {
    //'@@router/LOCATION_CHANGE'
    let excluded = ['LOG_TO_EXCLUDE'];
    let pass = excluded.filter((act) => {
        return action.type === act;
    });
    return pass.length === 0;
}

const logger: Middleware = createLogger({
    level: 'info',
    predicate: excludeLogger,
    collapsed: true
});

if (process.env.NODE_ENV === 'development') {
    const devToolsExtension: ?Function = window.devToolsExtension;
    if (typeof devToolsExtension === 'function') {
        enhancers.push(devToolsExtension());
    }
}

const composedEnhancers: GenericStoreEnhancer = compose(
    applyMiddleware(...middleware, logger, ...services),
    ...enhancers
);

export default createStore(
    reducers,
    initialState,
    composedEnhancers
);