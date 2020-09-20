import TrezorConnect from 'trezor-connect';
import { MiddlewareAPI } from 'redux';

import { SUITE } from '@suite-actions/constants';
import * as firmwareActions from '@firmware-actions/firmwareActions';
import { AppState, Action, Dispatch } from '@suite-types';
import { FIRMWARE } from '@suite/actions/firmware/constants';

const firmware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    const prevApp = api.getState().router.app;

    // pass action
    next(action);

    const { status } = api.getState().firmware;

    switch (action.type) {
        case FIRMWARE.SET_UPDATE_STATUS: {
            const { device } = api.getState().suite;
            // device should always be connected here - button setting waiting-for-bootloader should be disabled when
            // device is not connected
            if (['waiting-for-bootloader', 'check-seed'].includes(action.payload) && device) {
                api.dispatch(firmwareActions.setTargetRelease(device.firmwareRelease));
            }
            break;
        }
        case SUITE.SELECT_DEVICE:
        case SUITE.UPDATE_SELECTED_DEVICE: // UPDATE_SELECTED_DEVICE is needed to handle if device is unacquired in SELECT_DEVICE
            // both saved and unsaved device
            if (status === 'unplug' && (!action.payload || !action.payload?.connected)) {
                api.dispatch(firmwareActions.setStatus('reconnect-in-normal'));
            }

            if (
                action.payload &&
                action.payload.features &&
                ['reconnect-in-normal', 'wait-for-reboot'].includes(status)
            ) {
                // firmwareActions.firmwareUpdate method sends skipFinalReload parameter into trezor-connect, which results
                // in capabilities not being reloaded properly even after device reconnect. this is because messages definitions
                // which are required to parse incoming message from trezor are reloaded only before call to device starts and
                // after it ends (if there is no skipFinalReload flag). This does not apply for our case here, so we must
                // force features reload.
                TrezorConnect.getFeatures({
                    device: {
                        path: action.payload.path,
                    },
                    keepSession: false,
                });
                if (action.payload.firmware === 'valid') {
                    api.dispatch(firmwareActions.setStatus('done'));
                } else if (['outdated', 'required'].includes(action.payload.firmware)) {
                    api.dispatch(firmwareActions.setStatus('partially-done'));
                }
            }
            break;
        case SUITE.APP_CHANGED:
            if (prevApp === 'firmware' || prevApp === 'onboarding') {
                api.dispatch(firmwareActions.resetReducer());
            }
            break;
        default:
    }

    return action;
};
export default firmware;
