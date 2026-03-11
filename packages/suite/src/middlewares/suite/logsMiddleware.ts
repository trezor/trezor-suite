import { MiddlewareAPI } from 'redux';

import { METADATA } from '@suite/metadata';
import { MODAL_CLOSE, MODAL_OPEN_USER_CONTEXT } from '@suite/modal';
import { routerLocationChange } from '@suite/router';
import { addLog } from '@suite-common/logger';
import { redactUserPathFromString } from '@trezor/utils';

import { DESKTOP_UPDATE, PROTOCOL, SUITE } from 'src/actions/suite/constants';
import { Action, AppState, Dispatch } from 'src/types/suite';
import { redactTransactionIdFromAnchor } from 'src/utils/suite/analytics';

const log =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        // IMPORTANT: Actions that are shared between native and desktop app can be found in this file: suite-common/logger/src/logsMiddleware.ts
        switch (action.type) {
            case SUITE.SET_LANGUAGE:
            case SUITE.SET_THEME:
            case SUITE.SET_ADDRESS_DISPLAY_TYPE:
            case SUITE.SET_AUTODETECT:
            case METADATA.ENABLE:
            case METADATA.DISABLE:
            case SUITE.ONION_LINKS:
            case DESKTOP_UPDATE.CHECKING:
            case DESKTOP_UPDATE.AVAILABLE:
            case DESKTOP_UPDATE.NOT_AVAILABLE:
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
            case DESKTOP_UPDATE.ALLOW_PRERELEASE:
            case DESKTOP_UPDATE.SET_AUTOMATIC_UPDATES:
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
