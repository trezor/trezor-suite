import { type Dispatch, type UnknownAction, isAnyOf } from '@reduxjs/toolkit';
import { type MiddlewareAPI } from 'redux';

import { desktopUpdateActions } from '@suite/desktop-update';
import { metadataActions } from '@suite/metadata';
import { closeModal, openModal } from '@suite/modal';
import { routerLocationChange } from '@suite/router';
import { suiteSettingsActions } from '@suite/settings';
import { updateOnlineStatus } from '@suite/suite-lifecycle';
import { torActions } from '@suite/tor';
import { addLog } from '@suite-common/logger';
import { setAddressDisplayType } from '@suite-common/wallet-core';
import { redactUserPathFromString } from '@trezor/utils';

import { saveCoinProtocol } from 'src/actions/suite/protocolActions';
import { type AppState } from 'src/types/suite';
import { redactAnchor } from 'src/utils/suite/analytics';

const log =
    (api: MiddlewareAPI<Dispatch<UnknownAction>, AppState>) =>
    (next: Dispatch<UnknownAction>) =>
    (action: UnknownAction): UnknownAction => {
        // IMPORTANT: Actions that are shared between native and desktop app can be found in this file: suite-common/logger/src/logsMiddleware.ts
        if (
            isAnyOf(
                suiteSettingsActions.setLanguage,
                suiteSettingsActions.setTheme,
                setAddressDisplayType,
                suiteSettingsActions.setAutodetect,
                suiteSettingsActions.setOnionLinks,
                desktopUpdateActions.checking,
                desktopUpdateActions.available,
                desktopUpdateActions.notAvailable,
                closeModal,
            )(action) ||
            metadataActions.enableMetadata.match(action) ||
            metadataActions.disableMetadata.match(action)
        ) {
            api.dispatch(
                addLog({
                    type: action.type,
                    payload: {
                        ...action,
                        type: undefined,
                    },
                }),
            );
        } else if (desktopUpdateActions.ready.match(action)) {
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
        } else if (metadataActions.addMetadataProvider.match(action)) {
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
        } else if (routerLocationChange.match(action)) {
            api.dispatch(
                addLog({
                    type: action.type,
                    payload: {
                        pathname: action.payload.pathname,
                        app: action.payload.app,
                        anchor: redactAnchor(action.payload.anchor),
                    },
                }),
            );
        } else if (
            isAnyOf(
                desktopUpdateActions.allowPrerelease,
                desktopUpdateActions.setAutomaticUpdates,
                torActions.setTorStatus,
                updateOnlineStatus,
            )(action)
        ) {
            api.dispatch(addLog({ type: action.type, payload: { status: action.payload } }));
        } else if (saveCoinProtocol.match(action)) {
            api.dispatch(addLog({ type: action.type, payload: { scheme: action.payload.scheme } }));
        } else if (openModal.match(action)) {
            api.dispatch(addLog({ type: action.type, payload: { type: action.payload.type } }));
        }

        return next(action);
    };

export default log;
