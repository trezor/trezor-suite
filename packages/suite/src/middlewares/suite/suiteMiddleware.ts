import { MiddlewareAPI } from 'redux';

import { notificationsActions } from '@suite-common/toast-notifications';
import {
    authConfirm,
    createDeviceInstanceThunk,
    deviceActions,
    forgetDisconnectedDevices,
    handleDeviceConnect,
    handleDeviceDisconnect,
    restartDiscoveryThunk,
    selectDeviceThunk,
    updateFeeInfoThunk,
} from '@suite-common/wallet-core';
import { DEVICE } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

import { ROUTER, SUITE } from 'src/actions/suite/constants';
import { handleProtocolRequest } from 'src/actions/suite/protocolActions';
import { appChanged, setFlag } from 'src/actions/suite/suiteActions';
import { Action, AppState, Dispatch } from 'src/types/suite';

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
            case SUITE.REQUEST_AUTH_CONFIRM:
                api.dispatch(authConfirm());
                break;
            case SUITE.ONLINE_STATUS:
                // Restart discovery to reconnect to backends when user goes offline -> online.
                if (action.payload === true) {
                    api.dispatch(restartDiscoveryThunk());
                }
                break;
            // TODO: remove when EIP-1559 complete
            case SUITE.SET_DEBUG_MODE: {
                const { enabledNetworks } = api.getState().wallet.settings;

                enabledNetworks.forEach(networkSymbol =>
                    api.dispatch(updateFeeInfoThunk({ networkSymbol, forceUpdate: true })),
                );
                break;
            }

            default:
                break;
        }

        return action;
    };

export default suite;
