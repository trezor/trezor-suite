import { type Middleware, applyMiddleware, compose, createStore } from 'redux';
import { createLogger } from 'redux-logger';
import { thunk } from 'redux-thunk';

import { trezorConnectMiddleware } from '../middlewares/trezorConnectMiddleware';
import { reducers } from '../reducers';
import { type AppState, type Dispatch } from '../types';

const enhancers: any[] = [];
const middleware = [thunk, trezorConnectMiddleware] as Middleware<Dispatch, AppState>[];

let composedEnhancers: any;
if (process.env.NODE_ENV === 'development') {
    const logger = createLogger({
        level: 'info',
        collapsed: true,
    });

    if (typeof window !== 'undefined') {
        // @ts-expect-error
        const { devToolsExtension } = window;
        if (typeof devToolsExtension === 'function') {
            enhancers.push(devToolsExtension());
        }
    }

    composedEnhancers = compose(applyMiddleware(...middleware, logger), ...enhancers);
} else {
    composedEnhancers = compose(applyMiddleware(...middleware), ...enhancers);
}

export const store = createStore(reducers, composedEnhancers);
