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
import { DISCOVERY } from '@wallet-actions/constants';
import { getAccountIdentifier } from '@suite-common/wallet-utils';
import { Account } from '@suite-common/wallet-types';
import { WALLET_SETTINGS } from '@settings-actions/constants';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import { redactTransactionIdFromAnchor } from '@suite-utils/analytics';
import { accountsActions, blockchainActions } from '@suite-common/wallet-core';
import { isAnyOf } from '@reduxjs/toolkit';
import { redactUserPathFromString } from '@trezor/utils';

const log =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        next(action);

        // avoid endless loops, see default in switch
        // also do not log any log related actions
        if (action.type.startsWith('@log')) return action;

        if (isAnyOf(accountsActions.createAccount, accountsActions.updateAccount)(action)) {
            const { payload }: { payload: Account } = action;
            api.dispatch(logActions.addAction(action, { ...payload }));
        }

        if (accountsActions.updateSelectedAccount.match(action)) {
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
        }

        if (blockchainActions.setBackend.match(action)) {
            api.dispatch(logActions.addAction(action, { ...action.payload, urls: undefined }));
        }

        if (walletSettingsActions.changeNetworks.match(action)) {
            api.dispatch(
                logActions.addAction(action, {
                    enabledNetworks: action.payload.join(','),
                }),
            );
        }

        switch (action.type) {
            case SUITE.SET_LANGUAGE:
            case SUITE.SET_THEME:
            case SUITE.SET_AUTODETECT:
            case walletSettingsActions.setLocalCurrency.type:
            case WALLET_SETTINGS.SET_HIDE_BALANCE:
            case METADATA.ENABLE:
            case METADATA.DISABLE:
            case SUITE.ONION_LINKS:
            case ANALYTICS.ENABLE:
            case ANALYTICS.DISABLE:
            case DESKTOP_UPDATE.CHECKING:
            case DESKTOP_UPDATE.AVAILABLE:
            case DESKTOP_UPDATE.NOT_AVAILABLE:
            case MODAL.CLOSE:
                api.dispatch(
                    logActions.addAction(action, {
                        ...action,
                        type: undefined,
                    }),
                );
                break;
            case DESKTOP_UPDATE.READY:
                api.dispatch(
                    logActions.addAction(action, {
                        version: action.payload.version,
                        releaseDate: action.payload.releaseDate,
                        downloadedFile: redactUserPathFromString(
                            action.payload.downloadedFile || '',
                        ),
                    }),
                );
                break;
            case SUITE.AUTH_DEVICE:
            case DEVICE.CONNECT:
            case DEVICE.DISCONNECT:
            case DISCOVERY.COMPLETE:
            case SUITE.UPDATE_SELECTED_DEVICE:
            case SUITE.REMEMBER_DEVICE:
                api.dispatch(
                    logActions.addAction(action, {
                        ...action.payload,
                        firmwareRelease: undefined,
                        unavailableCapabilities: undefined,
                    }),
                );
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
