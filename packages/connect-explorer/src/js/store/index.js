/* @flow */
'use strict';

import { createStore, applyMiddleware, compose } from 'redux';
import { routerMiddleware } from 'connected-react-router';
import thunk from 'redux-thunk';
import createHistory from 'history/createHashHistory';
import { createLogger } from 'redux-logger';
import createRootReducer from '../reducers';
import services from '../services';

export const history: History = createHistory( { queryKey: false } );

const initialState: any = {};
const enhancers = [];
const middleware = [
    thunk,
    routerMiddleware(history)
];

let composedEnhancers: any;
if (process.env.NODE_ENV === 'development') {

    const excludeLogger = (getState: GetState, action: Action): boolean => {
        //'@@router/LOCATION_CHANGE'
        const excluded: Array<string> = ['LOG_TO_EXCLUDE', 'log__add'];
        const pass: Array<string> = excluded.filter((act) => {
            return action.type === act;
        });
        return pass.length === 0;
    }
    
    const logger = createLogger({
        level: 'info',
        predicate: excludeLogger,
        collapsed: true
    });

    const devToolsExtension: ?Function = window.devToolsExtension;
    if (typeof devToolsExtension === 'function') {
        enhancers.push(devToolsExtension());
    }

    composedEnhancers = compose(
        applyMiddleware(...middleware, logger, ...services),
        ...enhancers
    );
} else {
    composedEnhancers = compose(
        applyMiddleware(...middleware, ...services),
        ...enhancers
    );
}

export default createStore(
    createRootReducer(history),
    initialState,
    composedEnhancers
);

// if (process.env.NODE_ENV === 'production') {
//     module.exports = require('./store.dev'); // eslint-disable-line global-require
// } else {
//     module.exports = require('./store.dev'); // eslint-disable-line global-require
// }