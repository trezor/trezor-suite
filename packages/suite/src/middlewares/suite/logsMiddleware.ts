import { MiddlewareAPI } from 'redux';
import { AppState, Action, Dispatch } from 'src/types/suite';
import {
    DESKTOP_UPDATE,
    METADATA,
    MODAL,
    PROTOCOL,
    ROUTER,
    SUITE,
} from 'src/actions/suite/constants';
import { WALLET_SETTINGS } from 'src/actions/settings/constants';
import * as walletSettingsActions from 'src/actions/settings/walletSettingsActions';
import { redactTransactionIdFromAnchor } from 'src/utils/suite/analytics';

import { addLog } from '@suite-common/logger';
import { TRANSPORT, DEVICE } from '@trezor/connect';
import { redactUserPathFromString } from '@trezor/utils';
import { analyticsActions } from '@suite-common/analytics';
import { discoveryActions } from 'src/actions/wallet/discoveryActions';

const log =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        // IMPORTANT: Part of the middleware that's using actions from suite-common/wallet-core package
        // can be found in this file: suite-common/logger/src/logsMiddleware.ts

        if (walletSettingsActions.changeNetworks.match(action)) {
            api.dispatch(
                addLog({
                    action,
                    type: action.type,
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
            case analyticsActions.enableAnalytics.type:
            case analyticsActions.disableAnalytics.type:
            case DESKTOP_UPDATE.CHECKING:
            case DESKTOP_UPDATE.AVAILABLE:
            case DESKTOP_UPDATE.NOT_AVAILABLE:
            case MODAL.CLOSE:
                api.dispatch(
                    addLog({
                        type: action.type,
                        payload: {
                            ...action,
                            type: undefined,
                        },
                    }),
                );
                break;
            case DESKTOP_UPDATE.READY:
                api.dispatch(
                    addLog({
                        type: action.type,
                        payload: {
                            version: action.payload.version,
                            releaseDate: action.payload.releaseDate,
                            downloadedFile: redactUserPathFromString(
                                action.payload.downloadedFile || '',
                            ),
                        },
                    }),
                );
                break;
            case SUITE.AUTH_DEVICE:
            case DEVICE.CONNECT:
            case DEVICE.DISCONNECT:
            case discoveryActions.completeDiscovery.type:
            case SUITE.UPDATE_SELECTED_DEVICE:
            case SUITE.REMEMBER_DEVICE:
                api.dispatch(
                    addLog({
                        type: action.type,
                        payload: {
                            ...action.payload,
                            firmwareRelease: undefined,
                            unavailableCapabilities: undefined,
                        },
                    }),
                );
                break;
            case METADATA.ADD_PROVIDER:
                api.dispatch(
                    addLog({
                        type: action.type,
                        payload: {
                            ...action.payload,
                            tokens: undefined,
                            user: undefined,
                        },
                    }),
                );
                break;
            case TRANSPORT.START:
                api.dispatch(
                    addLog({
                        type: action.type,
                        payload: {
                            type: action.payload.type,
                            version: action.payload.version,
                        },
                    }),
                );
                break;
            case TRANSPORT.ERROR:
                api.dispatch(
                    addLog({ type: action.type, payload: { error: action.payload.error } }),
                );
                break;
            case ROUTER.LOCATION_CHANGE:
                api.dispatch(
                    addLog({
                        type: action.type,
                        payload: {
                            pathname: action.payload.pathname,
                            app: action.payload.app,
                            anchor: redactTransactionIdFromAnchor(action.payload.anchor),
                        },
                    }),
                );
                break;
            case DESKTOP_UPDATE.ALLOW_PRERELEASE:
            case SUITE.TOR_STATUS:
            case SUITE.ONLINE_STATUS:
                api.dispatch(
                    addLog({
                        type: action.type,
                        payload: {
                            status: action.payload,
                        },
                    }),
                );
                break;
            case SUITE.ADD_BUTTON_REQUEST:
                if (action.payload) {
                    api.dispatch(
                        addLog({
                            type: action.type,
                            payload: {
                                code: action.payload.code,
                            },
                        }),
                    );
                }
                break;
            case PROTOCOL.SAVE_COIN_PROTOCOL:
                api.dispatch(
                    addLog({
                        type: action.type,
                        payload: {
                            scheme: action.payload.scheme,
                        },
                    }),
                );
                break;
            case MODAL.OPEN_USER_CONTEXT:
                api.dispatch(
                    addLog({
                        type: action.type,
                        payload: {
                            type: action.payload.type,
                        },
                    }),
                );
                break;

            // no default
        }
        return next(action);
    };

export default log;
