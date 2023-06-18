import { SUITE } from 'src/actions/suite/constants';
import { FIRMWARE } from 'src/actions/firmware/constants';
import * as firmwareActions from 'src/actions/firmware/firmwareActions';
import type { MiddlewareAPI } from 'redux';
import type { AppState, Action, Dispatch } from 'src/types/suite';

const firmware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        const { firmware, router } = api.getState();
        const { prevDevice } = firmware;
        // pass action
        next(action);

        const { status, intermediaryInstalled } = api.getState().firmware;
        switch (action.type) {
            case FIRMWARE.SET_UPDATE_STATUS: {
                const { device } = api.getState().suite;

                // device should always be connected here - button setting waiting-for-bootloader should be disabled when
                // device is not connected.
                if (['waiting-for-bootloader', 'check-seed'].includes(action.payload) && device) {
                    api.dispatch(firmwareActions.setTargetRelease(device.firmwareRelease));

                    // remember previous device for firmware type check (regular/bitcoin-only) and analytics
                    api.dispatch(firmwareActions.rememberPreviousDevice(device));
                }

                break;
            }

            case SUITE.SELECT_DEVICE:
            case SUITE.UPDATE_SELECTED_DEVICE: // UPDATE_SELECTED_DEVICE is needed to handle if device is unacquired in SELECT_DEVICE
                // both saved and unsaved device
                // disconnected
                if (status === 'unplug' && (!action.payload || !action.payload?.connected)) {
                    // even if we are going to install subsequent update after intermediary fw installation, user doesn't have to hold any buttons, device will be connected in BL anyway
                    api.dispatch(firmwareActions.setStatus('reconnect-in-normal'));
                }

                // this if section takes care of incremental update, how does it work:
                // 1. I realize that I can't update to the latest firmware (see @trezor/connect/src/api/firmware)
                // 2. I use special intermediary firmware instead of using normal one (see @trezor/connect/src/api/firmware)
                // 3. Intermediary firmware updates bootloader to the latest and keeps device in bootloader mode after reconnect
                // 4. This point happens here. After I reconnect the device, firmware middleware finds that the newly connected
                // device does not have the latest firmware, proceed with subsequent updated automatically
                // todo: this is a 'client side' implementation. It would be nicer to have it in @trezor/connect
                // todo: but this would require reworking the entire TRAKTOR

                if (
                    // these 3 conditions cover any device reconnected in bootloader mode (possibly accidentally)
                    // 'wait-for-reboot' (BL >= 1.10.0) is just for easier testing, 'reconnect-in-normal' for real world devices that will install intermediary
                    (status === 'wait-for-reboot' || status === 'reconnect-in-normal') &&
                    action.payload?.connected &&
                    action.payload?.mode === 'bootloader' &&
                    // this one is the key, if there was previous firmware update that set intermediaryInstalled, proceed with subsequent update automatically
                    intermediaryInstalled
                ) {
                    console.warn(
                        'Device with intermediary firmware detected. Installing the latest update.',
                    );
                    api.dispatch(firmwareActions.firmwareUpdate(firmware.targetType));
                    break;
                }

                // here user connected device that was force remembered before
                if (
                    action.payload?.features &&
                    action.payload?.connected &&
                    action.payload?.mode !== 'bootloader' && // after custom firmware install waiting for confirmation of fingerprint
                    ['reconnect-in-normal', 'wait-for-reboot'].includes(status) &&
                    !intermediaryInstalled &&
                    // if prevDevice is set, then prevDevice.id must equal currently connected device.id
                    // device id is not set in onboarding fresh device (no firmware installed, no device id, is in bootloader mode)
                    (!prevDevice?.id || prevDevice.id === action.payload.id)
                ) {
                    api.dispatch(firmwareActions.validateFirmwareHash(action.payload));
                }
                break;
            case SUITE.APP_CHANGED:
                // leaving firmware update context
                if (['firmware', 'firmware-type', 'onboarding'].includes(router.app)) {
                    api.dispatch(firmwareActions.resetReducer());
                }

                break;
            default:
        }

        return action;
    };
export default firmware;
