import { createStore, applyMiddleware, compose } from 'redux';
import { routerMiddleware } from 'connected-react-router';
import thunk from 'redux-thunk';
import createHistory from 'history/createHashHistory';
import { createLogger } from 'redux-logger';
import createRootReducer from '../reducers';
import services from '../services';
import { GetState, Action } from '../types';

export const history = createHistory();

const initialState = {};
const enhancers: any[] = [];
const middleware = [thunk, routerMiddleware(history)];

let composedEnhancers: any;
if (process.env.NODE_ENV === 'development') {
    // @ts-ignore
    const excludeLogger = (getState: GetState, action: Action): boolean => {
        // '@@router/LOCATION_CHANGE'
        const excluded: string[] = ['LOG_TO_EXCLUDE', 'log__add'];
        const pass: string[] = excluded.filter((act: string) => {
            return action.type === act;
        });
        return pass.length === 0;
    };

    const logger = createLogger({
        level: 'info',
        predicate: excludeLogger,
        collapsed: true,
    });

    const { devToolsExtension } = window;
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

const rootReducer = createRootReducer(history);

export type AppState = ReturnType<typeof rootReducer>;

export default createStore(rootReducer, initialState, composedEnhancers);

// if (process.env.NODE_ENV === 'production') {
//     module.exports = require('./store.dev'); // eslint-disable-line global-require
// } else {
//     module.exports = require('./store.dev'); // eslint-disable-line global-require
// }
