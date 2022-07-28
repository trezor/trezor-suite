/* eslint-disable @typescript-eslint/naming-convention */
import { MiddlewareAPI } from 'redux';
import { AppState, Action, Dispatch } from '@suite-types';
import * as logActions from '@suite-actions/logsActions';
import { TRANSPORT, DEVICE } from '@trezor/connect';
import {
    ANALYTICS,
    DESKTOP_UPDATE,
    METADATA,
    MODAL,
    PROTOCOL,
    ROUTER,
    SUITE,
} from '@suite-actions/constants';
import { ACCOUNT, DISCOVERY, BLOCKCHAIN } from '@wallet-actions/constants';
import { getAccountIdentifier } from '@suite-common/wallet-utils';
import { WALLET_SETTINGS } from '@settings-actions/constants';
import { redactTransactionIdFromAnchor } from '@suite-utils/analytics';

const log =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        next(action);

        // avoid endless loops, see default in switch
        // also do not log any log related actions
        if (action.type.startsWith('@log')) return action;

        switch (action.type) {
            case SUITE.SET_LANGUAGE:
            case SUITE.SET_THEME:
            case SUITE.SET_AUTODETECT:
            case WALLET_SETTINGS.SET_LOCAL_CURRENCY:
            case WALLET_SETTINGS.SET_HIDE_BALANCE:
            case METADATA.ENABLE:
            case METADATA.DISABLE:
            case SUITE.ONION_LINKS:
            case ANALYTICS.ENABLE:
            case ANALYTICS.DISABLE:
            case DESKTOP_UPDATE.CHECKING:
            case DESKTOP_UPDATE.AVAILABLE:
            case DESKTOP_UPDATE.NOT_AVAILABLE:
            case DESKTOP_UPDATE.READY:
            case MODAL.CLOSE:
                api.dispatch(
                    logActions.addAction(action, {
                        ...action,
                        type: undefined,
                    }),
                );
                break;
            case SUITE.AUTH_DEVICE:
            case DEVICE.CONNECT:
            case DEVICE.DISCONNECT:
            case ACCOUNT.CREATE:
            case ACCOUNT.UPDATE:
            case DISCOVERY.COMPLETE:
            case SUITE.UPDATE_SELECTED_DEVICE:
            case SUITE.REMEMBER_DEVICE:
                api.dispatch(logActions.addAction(action, { ...action.payload }));
                break;
            case METADATA.SET_PROVIDER:
                api.dispatch(
                    logActions.addAction(action, {
                        ...action.payload,
                        tokens: undefined,
                        user: undefined,
                    }),
                );
                break;
            case WALLET_SETTINGS.CHANGE_NETWORKS:
                api.dispatch(
                    logActions.addAction(action, {
                        enabledNetworks: action.payload.join(','),
                    }),
                );
                break;
            case TRANSPORT.START:
                api.dispatch(
                    logActions.addAction(action, {
                        type: action.payload.type,
                        version: action.payload.version,
                    }),
                );
                break;
            case TRANSPORT.ERROR:
                api.dispatch(logActions.addAction(action, { error: action.payload.error }));
                break;
            case BLOCKCHAIN.SET_BACKEND:
                api.dispatch(logActions.addAction(action, { ...action.payload, urls: undefined }));
                break;
            case ACCOUNT.UPDATE_SELECTED_ACCOUNT:
                if (action.payload.account) {
                    api.dispatch(
                        logActions.addAction(action, {
                            account: {
                                ...getAccountIdentifier(action.payload.account),
                                index: action.payload.account.index,
                                path: action.payload.account.path,
                            },
                        }),
                    );
                } else {
                    api.dispatch(logActions.addAction(action, { ...action, type: undefined }));
                }

                break;
            case ROUTER.LOCATION_CHANGE:
                api.dispatch(
                    logActions.addAction(action, {
                        pathname: action.payload.pathname,
                        app: action.payload.app,
                        anchor: redactTransactionIdFromAnchor(action.payload.anchor),
                    }),
                );
                break;
            case DESKTOP_UPDATE.ALLOW_PRERELEASE:
            case SUITE.TOR_STATUS:
            case SUITE.ONLINE_STATUS:
                api.dispatch(
                    logActions.addAction(action, {
                        status: action.payload,
                    }),
                );
                break;
            case SUITE.ADD_BUTTON_REQUEST:
                if (action.payload) {
                    api.dispatch(
                        logActions.addAction(action, {
                            code: action.payload.code,
                        }),
                    );
                }
                break;
            case PROTOCOL.SAVE_COIN_PROTOCOL:
                api.dispatch(
                    logActions.addAction(action, {
                        scheme: action.payload.scheme,
                    }),
                );
                break;
            case MODAL.OPEN_USER_CONTEXT:
                api.dispatch(
                    logActions.addAction(action, {
                        type: action.payload.type,
                    }),
                );
                break;

            // no default
        }
        return action;
    };

export default log;
