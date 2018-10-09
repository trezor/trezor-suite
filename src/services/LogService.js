/* @flow */
import * as LogActions from 'actions/LogActions';
import { TRANSPORT, DEVICE } from 'trezor-connect';
import * as DISCOVERY from 'actions/constants/discovery';

import type {
    Middleware,
    MiddlewareAPI,
    MiddlewareDispatch,
    Action,
} from 'flowtype';

const actions: Array<string> = [
    TRANSPORT.START,
    DEVICE.CONNECT,
    DEVICE.DISCONNECT,
    DISCOVERY.START,
];

/**
 * Middleware
 */
const LogService: Middleware = (api: MiddlewareAPI) => (next: MiddlewareDispatch) => (action: Action): Action => {
    next(action);

    if (actions.indexOf(action.type) < 0) return action;

    switch (action.type) {
        case TRANSPORT.START:
            api.dispatch(LogActions.add('Transport', { type: action.payload.type, version: action.payload.version }));
            break;
        case DEVICE.CONNECT:
            api.dispatch(LogActions.add('Device connected', action.device));
            break;
        case DEVICE.DISCONNECT:
            api.dispatch(LogActions.add('Device disconnected', action.device));
            break;
        case DISCOVERY.START:
            api.dispatch(LogActions.add('Discovery started', action));
            break;
        default: break;
    }

    // if (action.type === TRANSPORT.START) {
    //     api.dispatch(LogActions.add('Transport', action.payload));
    // } else if (action.type === DEVICE.CONNECT) {
    //     api.dispatch(LogActions.add(action.type, action));
    // }

    return action;
};

export default LogService;