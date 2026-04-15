import { type MiddlewareAPI } from 'redux';

import { desktopUpdateActions } from '@suite/desktop-update';
import { METADATA } from '@suite/metadata';
import { MODAL_CLOSE, MODAL_OPEN_USER_CONTEXT } from '@suite/modal';
import { routerLocationChange } from '@suite/router';
import { suiteSettingsActions } from '@suite/settings';
import { addLog } from '@suite-common/logger';
import { redactUserPathFromString } from '@trezor/utils';

import { PROTOCOL, SUITE } from 'src/actions/suite/constants';
import { type Action, type AppState, type Dispatch } from 'src/types/suite';
import { redactTransactionIdFromAnchor } from 'src/utils/suite/analytics';

const log =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        // IMPORTANT: Actions that are shared between native and desktop app can be found in this file: suite-common/logger/src/logsMiddleware.ts
        switch (action.type) {
            case suiteSettingsActions.setLanguage.type:
            case suiteSettingsActions.setTheme.type:
            case suiteSettingsActions.setAddressDisplayType.type:
            case suiteSettingsActions.setAutodetect.type:
            case METADATA.ENABLE:
            case METADATA.DISABLE:
            case suiteSettingsActions.setOnionLinks.type:
            case desktopUpdateActions.checking.type:
            case desktopUpdateActions.available.type:
            case desktopUpdateActions.notAvailable.type:
            case MODAL_CLOSE:
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
            case desktopUpdateActions.ready.type:
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
            case routerLocationChange.type:
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
            case desktopUpdateActions.allowPrerelease.type:
            case desktopUpdateActions.setAutomaticUpdates.type:
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
            case MODAL_OPEN_USER_CONTEXT:
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
