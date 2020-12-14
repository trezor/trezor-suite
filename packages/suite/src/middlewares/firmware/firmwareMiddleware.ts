import { MiddlewareAPI } from 'redux';
import TrezorConnect from 'trezor-connect';

import { SUITE } from '@suite-actions/constants';
import * as firmwareActions from '@firmware-actions/firmwareActions';
import * as suiteActions from '@suite-actions/suiteActions';

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
            // device is not connected.
            if (['waiting-for-bootloader', 'check-seed'].includes(action.payload) && device) {
                api.dispatch(firmwareActions.setTargetRelease(device.firmwareRelease));

                // in case device is not remembered, force remember here. this is needed to handle device update correctly
                // when multiple devices are connected.
                if (!device.remember) {
                    api.dispatch(suiteActions.rememberDevice(device, true));
                }
            }

            break;
        }

        case SUITE.SELECT_DEVICE:
        case SUITE.UPDATE_SELECTED_DEVICE: // UPDATE_SELECTED_DEVICE is needed to handle if device is unacquired in SELECT_DEVICE
            // !action.payload.connected means that user disconnected device that was force remembered
            if (status === 'unplug' && (!action.payload || !action.payload?.connected)) {
                api.dispatch(firmwareActions.setStatus('reconnect-in-normal'));
            }

            // here user connected device that was force remembered before
            if (
                action.payload &&
                action.payload.features &&
                action.payload.connected &&
                ['reconnect-in-normal', 'wait-for-reboot'].includes(status)
            ) {
                // TLDR: if you don't reload features, after updating model T from non-shamir firmware to shamir firmware, you
                // won't see shamir vs. standard wallet selection.
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
            // leaving firmware update context
            if (prevApp === 'firmware' || prevApp === 'onboarding') {
                const { device } = api.getState().suite;

                api.dispatch(firmwareActions.resetReducer());

                // clean up force remembered device if applicable
                if (device?.features && device.forceRemember) {
                    api.dispatch(suiteActions.rememberDevice(device));
                }
            }

            // entering firmware update context is not handled here. In onboarding device may not be connected
            // in the beginning, so remember happens after firmware.status is changed to check-seed or waiting-for-bootloader, see^^

            break;
        default:
    }

    return action;
};
export default firmware;
