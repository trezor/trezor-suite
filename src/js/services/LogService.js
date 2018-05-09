/* @flow */
'use strict';

import * as LogActions from '../actions/LogActions';
import * as STORAGE from '../actions/constants/localStorage';
import * as SEND from '../actions/constants/send';
import { OPEN, CLOSE, ADD } from '../actions/constants/log';

import type { 
    Middleware,
    MiddlewareAPI,
    MiddlewareDispatch,
    State,
    Dispatch,
    Action,
    AsyncAction,
    GetState 
} from '../flowtype';

const exclude: Array<string> = [
    ADD, OPEN, CLOSE,
    STORAGE.READY,
    SEND.TX_COMPLETE,
    "web3__create"
];

/**
 * Middleware 
 */
const LogService: Middleware = (api: MiddlewareAPI) => (next: MiddlewareDispatch) => (action: Action): Action => {

    next(action);

    if (exclude.indexOf(action.type) < 0) {
        // api.dispatch(LogActions.add(action.type, JSON.stringify( action )));
        api.dispatch(LogActions.add(action.type, action));
    }

    return action;
};

export default LogService;