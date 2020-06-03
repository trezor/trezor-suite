/* eslint-disable @typescript-eslint/camelcase */
import { MiddlewareAPI } from 'redux';
import { AppState, Action, Dispatch } from '@suite-types';
import * as logActions from '@suite-actions/logActions';
import { TRANSPORT, DEVICE } from 'trezor-connect';
import { SUITE } from '@suite-actions/constants';
import { ACCOUNT, TRANSACTION, DISCOVERY } from '@wallet-actions/constants';
import { getUserAgent } from '@suite-utils/env';

const log = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    // pass action
    next(action);

    // avoid endless loops, see default in switch
    // also do not log any log related actions
    if (action.type.startsWith('@log')) return action;

    // log actions we are interested in
    switch (action.type) {
        case SUITE.INIT:
            api.dispatch(
                logActions.add(action.type, {
                    // todo: ? because of native. I didnt want to duplicate entire file
                    userAgent: getUserAgent(),
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
                    device_id: action.payload.id,
                    state: action.payload.state,
                }),
            );
            break;
        case DISCOVERY.COMPLETE:
            api.dispatch(logActions.add(action.type, action.payload));
            break;
        case ACCOUNT.CREATE:
        case ACCOUNT.UPDATE:
            api.dispatch(logActions.add(action.type, action.payload));
            break;
        case ACCOUNT.UPDATE_SELECTED_ACCOUNT:
            api.dispatch(logActions.add(action.type, action.payload));
            break;
        case TRANSACTION.ADD:
            api.dispatch(
                logActions.add(action.type, {
                    account: action.account,
                    transactions: action.transactions,
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
