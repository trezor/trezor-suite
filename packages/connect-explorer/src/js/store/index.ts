import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import { createLogger } from 'redux-logger';
import reducers from '../reducers';
import { routerMiddleware } from '../middlewares/routerMiddleware';
import { trezorConnectMiddleware } from '../middlewares/trezorConnectMiddleware';

const enhancers: any[] = [];
const middleware = [thunk, routerMiddleware, trezorConnectMiddleware];

let composedEnhancers: any;
if (process.env.NODE_ENV === 'development') {
    const excludeLogger = (_getState: any, action: any): boolean => {
        const excluded: Array<string> = ['LOG_TO_EXCLUDE', 'log__add'];
        const pass: Array<string> = excluded.filter(act => action.type === act);
        return pass.length === 0;
    };

    const logger = createLogger({
        level: 'info',
        predicate: excludeLogger,
        collapsed: true,
    });

    // @ts-ignore
    const { devToolsExtension } = window;
    if (typeof devToolsExtension === 'function') {
        enhancers.push(devToolsExtension());
    }

    composedEnhancers = compose(applyMiddleware(...middleware, logger), ...enhancers);
} else {
    composedEnhancers = compose(applyMiddleware(...middleware), ...enhancers);
}

const store = createStore(reducers, composedEnhancers);

export default store;
