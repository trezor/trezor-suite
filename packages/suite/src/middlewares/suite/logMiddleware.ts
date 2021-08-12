/* eslint-disable @typescript-eslint/naming-convention */
import { MiddlewareAPI } from 'redux';
import { AppState, Action, Dispatch } from '@suite-types';
import * as logActions from '@suite-actions/logActions';
import { TRANSPORT, DEVICE } from 'trezor-connect';
import { SUITE } from '@suite-actions/constants';
import { ACCOUNT, TRANSACTION, DISCOVERY } from '@wallet-actions/constants';
import { getUserAgent } from '@suite-utils/env';
import { getAccountIdentifier } from '@suite/utils/wallet/accountUtils';

const log =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        // pass action
        next(action);

        // avoid endless loops, see default in switch
        // also do not log any log related actions
        if (action.type.startsWith('@log')) return action;

        // log actions we are interested in
        switch (action.type) {
            case SUITE.INIT:
                api.dispatch(
                    logActions.addCustom(action, {
                        // todo: ? because of native. I didnt want to duplicate entire file
                        userAgent: getUserAgent(),
                        commitHash: process.env.COMMITHASH,
                        suiteType: process.env.SUITE_TYPE,
                    }),
                );
                break;
            case SUITE.SET_LANGUAGE:
                api.dispatch(logActions.addCustom(action, { locale: action.locale }));
                break;
            case TRANSPORT.START:
                api.dispatch(
                    logActions.addCustom(action, {
                        type: action.payload.type,
                        version: action.payload.version,
                    }),
                );
                break;
            case TRANSPORT.ERROR:
                api.dispatch(logActions.addCustom(action, { error: action.payload.error }));
                break;
            case SUITE.AUTH_DEVICE:
                api.dispatch(
                    logActions.addCustom(action, {
                        device_id: action.payload.id,
                        state: action.payload.state,
                    }),
                );
                break;

            case DEVICE.CONNECT:
            case DEVICE.DISCONNECT:
                api.dispatch(
                    logActions.addCustom(action, {
                        ...action.payload,
                        firmwareRelease: undefined,
                        release: undefined,
                    }),
                );
                break;
            case SUITE.APP_CHANGED:
            case DISCOVERY.COMPLETE:
                api.dispatch(logActions.addAction(action));
                break;
            case ACCOUNT.UPDATE_SELECTED_ACCOUNT:
                if (action.payload.account) {
                    api.dispatch(
                        logActions.addCustom(action, {
                            account: {
                                ...getAccountIdentifier(action.payload.account),
                                index: action.payload.account.index,
                                path: action.payload.account.path,
                            },
                            network: undefined,
                            discovery: undefined,
                        }),
                    );
                } else {
                    api.dispatch(logActions.addAction(action));
                }

                break;
            case TRANSACTION.ADD:
                api.dispatch(
                    logActions.addCustom(action, {
                        account: getAccountIdentifier(action.account),
                        transactions: action.transactions,
                    }),
                );
                break;
            case SUITE.UPDATE_SELECTED_DEVICE:
                api.dispatch(
                    logActions.addCustom(action, {
                        id: action.payload.id,
                        state: action.payload.state,
                        path: action.payload.path,
                    }),
                );
                break;
            case ACCOUNT.CREATE:
            case ACCOUNT.UPDATE:
                api.dispatch(
                    logActions.addAction({
                        ...action,
                        payload: {
                            ...action.payload,
                            addresses: undefined,
                            history: { ...action.payload.history, transactions: undefined },
                        },
                    }),
                );
                break;
            default:
                // for rest actions, log only type
                api.dispatch(logActions.addAction(action, { stripPayload: true }));
        }
        return action;
    };

export default log;
