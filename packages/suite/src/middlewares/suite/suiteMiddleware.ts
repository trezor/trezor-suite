import { isAnyOf } from '@reduxjs/toolkit';
import { MiddlewareAPI } from 'redux';

import { AnyAction } from '@suite-common/redux-utils';
import { isAnyDeviceEventAction } from '@suite-common/suite-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    createDeviceInstanceThunk,
    deviceActions,
    forgetDisconnectedDevices,
    handleDeviceConnect,
    handleDeviceDisconnect,
    observeSelectedDevice,
    restartDiscoveryThunk,
    selectDeviceThunk,
} from '@suite-common/wallet-core';
import { DEVICE } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

import { METADATA, ROUTER, SUITE } from 'src/actions/suite/constants';
import { handleProtocolRequest } from 'src/actions/suite/protocolActions';
import { appChanged, setFlag } from 'src/actions/suite/suiteActions';
import { Action, AppState, Dispatch } from 'src/types/suite';

const isActionDeviceRelated = (action: AnyAction): boolean => {
    if (
        isAnyOf(
            deviceActions.selectDevice,
            deviceActions.updatePassphraseMode,
            deviceActions.addButtonRequest,
            deviceActions.removeButtonRequests,
            deviceActions.rememberDevice,
            deviceActions.forgetDevice,
            // ?
            deviceActions.setDeviceState,
        )(action)
    ) {
        return true;
    }

    if (action.type === METADATA.SET_DEVICE_METADATA) return true;
    if (action.type === METADATA.SET_DEVICE_METADATA_PASSWORDS) return true;

    if (isAnyDeviceEventAction(action)) return true;

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

        if (createDeviceInstanceThunk.fulfilled.match(action)) {
            api.dispatch(selectDeviceThunk({ device: action.payload.device }));
        }

        if (deviceActions.forgetDevice.match(action)) {
            api.dispatch(handleDeviceDisconnect(action.payload.device));
        }

        if (deviceActions.connectDevice.match(action)) {
            const isT3T1 =
                action.payload?.device?.features?.internal_model === DeviceModelInternal.T3T1;
            const isT3T1DashboardPromoBannerActive =
                api.getState().suite.flags.showDashboardT3T1PromoBanner;

            if (isT3T1 && isT3T1DashboardPromoBannerActive) {
                api.dispatch(setFlag('showDashboardT3T1PromoBanner', false));
            }
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
                api.dispatch(handleDeviceConnect(action.payload.device));
                break;
            case DEVICE.DISCONNECT:
                api.dispatch(handleDeviceDisconnect(action.payload));
                break;
            case SUITE.ONLINE_STATUS:
                // Restart discovery to reconnect to backends when user goes offline -> online.
                if (action.payload === true) {
                    api.dispatch(restartDiscoveryThunk());
                }
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
