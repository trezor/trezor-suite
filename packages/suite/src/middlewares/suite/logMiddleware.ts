/* eslint-disable @typescript-eslint/camelcase */
import { MiddlewareAPI } from 'redux';
import { AppState, Action, Dispatch } from '@suite-types';
import * as logActions from '@suite-actions/logActions';
import { TRANSPORT, DEVICE } from 'trezor-connect';
import { SUITE, LOG } from '@suite-actions/constants';
import { ACCOUNT } from '@wallet-actions/constants';

const log = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    // pass action
    next(action);

    // avoid endless loops, see default in switch
    if (action.type === LOG.ADD) return action;

    // log actions we are interested in
    switch (action.type) {
        case SUITE.INIT:
            api.dispatch(
                logActions.add(action.type, {
                    userAgent: navigator.userAgent,
                    commitHash: process.env.COMMITHASH,
                    suiteType: process.env.SUITE_TYPE,
                }),
            );
            break;
        case SUITE.SET_LANGUAGE:
            api.dispatch(logActions.add(action.type, { locale: action.locale }));
            break;
        case TRANSPORT.START:
            api.dispatch(
                logActions.add(action.type, {
                    type: action.payload.type,
                    version: action.payload.version,
                }),
            );
            break;
        case TRANSPORT.ERROR:
            api.dispatch(logActions.add(action.type, { error: action.payload.error }));
            break;
        case DEVICE.CONNECT:
        case DEVICE.DISCONNECT:
            api.dispatch(logActions.add(action.type, action.payload));
            break;
        case SUITE.APP_CHANGED:
            api.dispatch(logActions.add(action.type, action.payload));
            break;
        case SUITE.AUTH_DEVICE:
            api.dispatch(
                logActions.add(action.type, {
                    device_id: action.payload.features?.device_id,
                    state: action.payload.state,
                }),
            );
            break;
        case ACCOUNT.CREATE:
            api.dispatch(
                logActions.add(action.type, {
                    deviceState: action.payload.deviceState,
                    descriptor: action.payload.descriptor,
                    path: action.payload.path,
                }),
            );
            break;
        default:
            // for rest actions, log only type
            api.dispatch(logActions.add(action.type, {}));
    }
    return action;
};

export default log;
