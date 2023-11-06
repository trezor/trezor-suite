import { MiddlewareAPI } from 'redux';
import { AnyAction, isAnyOf } from '@reduxjs/toolkit';

import {
    authConfirm,
    deviceActions,
    forgetDisconnectedDevices,
    handleDeviceConnect,
    handleDeviceDisconnect,
    observeSelectedDevice,
    selectDeviceThunk,
} from '@suite-common/wallet-core';
import { notificationsActions } from '@suite-common/toast-notifications';
import { DEVICE } from '@trezor/connect';

import { SUITE, ROUTER, METADATA } from 'src/actions/suite/constants';
import { AppState, Action, Dispatch } from 'src/types/suite';
import { handleProtocolRequest } from 'src/actions/suite/protocolActions';
import { appChanged } from 'src/actions/suite/suiteActions';

const isActionDeviceRelated = (action: AnyAction): boolean => {
    if (
        isAnyOf(
            deviceActions.authDevice,
            deviceActions.authFailed,
            deviceActions.selectDevice,
            deviceActions.receiveAuthConfirm,
            deviceActions.updatePassphraseMode,
            deviceActions.addButtonRequest,
            deviceActions.rememberDevice,
            deviceActions.forgetDevice,
        )(action)
    ) {
        return true;
    }

    if (action.type === METADATA.SET_DEVICE_METADATA) return true;

    if (Object.values(DEVICE).includes(action.type)) return true;

    return false;
};
const suite =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        const prevApp = api.getState().router.app;
        if (action.type === ROUTER.LOCATION_CHANGE && action.payload.app !== prevApp) {
            api.dispatch(appChanged(action.payload.app));
        }

        // this action needs to be processed before propagation to deviceReducer
        // otherwise device will not be accessible and related data will not be removed (accounts, txs...)
        if (action.type === DEVICE.DISCONNECT) {
            api.dispatch(forgetDisconnectedDevices(action.payload));
        }

        // pass action to reducers
        next(action);

        if (deviceActions.createDeviceInstance.match(action)) {
            api.dispatch(selectDeviceThunk(action.payload.id));
        }

        if (deviceActions.forgetDevice.match(action)) {
            api.dispatch(handleDeviceDisconnect(action.payload));
        }

        switch (action.type) {
            case SUITE.DESKTOP_HANDSHAKE:
                if (action.payload.protocol) {
                    api.dispatch(handleProtocolRequest(action.payload.protocol));
                }
                if (action.payload.desktopUpdate?.firstRun) {
                    api.dispatch(
                        notificationsActions.addToast({
                            type: 'auto-updater-new-version-first-run',
                            version: action.payload.desktopUpdate.firstRun,
                        }),
                    );
                }
                break;
            case DEVICE.CONNECT:
            case DEVICE.CONNECT_UNACQUIRED:
                api.dispatch(handleDeviceConnect(action.payload));
                break;
            case DEVICE.DISCONNECT:
                api.dispatch(handleDeviceDisconnect(action.payload));
                break;
            case SUITE.REQUEST_AUTH_CONFIRM:
                api.dispatch(authConfirm());
                break;
            default:
                break;
        }

        if (isActionDeviceRelated(action)) {
            // keep suite reducer synchronized with other reducers (selected device)
            api.dispatch(observeSelectedDevice());
        }

        return action;
    };

export default suite;
