import { MiddlewareAPI } from 'redux';
import TrezorConnect, { DEVICE } from 'trezor-connect';

import { SUITE } from '@suite-actions/constants';
import * as firmwareActions from '@firmware-actions/firmwareActions';
import * as suiteActions from '@suite-actions/suiteActions';

import { AppState, Action, Dispatch } from '@suite-types';
import { FIRMWARE } from '@suite/actions/firmware/constants';

const firmware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    const { app: prevApp } = api.getState().router;

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

                // in case device is not remembered, force remember here. this is needed to handle device update correctly
                // when multiple devices are connected.
                // WARNING: This has never worked in case of fresh unpacked device without fw installed (or just used device with wiped fw).
                // Such device can't be remembered because it is always in bootloader mode and has no state
                // (rememberDevice functionality supports only devices in normal mode with defined state as it is used to remember wallets).
                // This may cause problems in combination with
                // a) remembered wallet - basically after fw installation, device is restarted and suite will select whatever available remembered device (wallet) as active device.
                // b) multiple physical devices connected
                // To mitigate this I would do following:
                // a) (done) make sure Suite won't select disconnected (remembered) device as active device (done in suiteActions.handleDeviceDisconnect)
                // b) (TODO) disallow going through onboarding/fw update with multiple physical devices connected at the same time (and if currently selected device has no fw installed)
                // This would save us from huge headache with hacky solutions like trying to remember a device before the update process
                // in exchange for just a slightly worse UX for users which have multiple connected devices (there will not be many of them)
                if (!device.remember) {
                    api.dispatch(suiteActions.toggleRememberDevice(device, true));
                }
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
            // 1. I realize that I can't update to the latest firmware (see @trezor/rollout)
            // 2. I use special intermediary firmware instead of using normal one (see @trezor/rollout and trezor-connect)
            // 3. Intermediary firmware updates bootloader to the latest and keeps device in bootloader mode after reconnect
            // 4. This point happens here. After I reconnect the device, firmware middleware finds that the newly connected
            // 4. device does not have the latest firmware, proceed with subsequent updated automatically
            // todo: this is a 'client side' implementation. It would be nicer to have it in trezor-connect
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
                api.dispatch(firmwareActions.firmwareUpdate());
                break;
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
                    api.dispatch(suiteActions.forgetDevice(device));
                }
            }

            // entering firmware update context is not handled here. In onboarding device may not be connected
            // in the beginning, so remember happens after firmware.status is changed to check-seed or waiting-for-bootloader, see^^

            break;
        case DEVICE.DISCONNECT:
            // we want to store data about previous device only in firmware update modal which is located in "firmware" and "onboarding" apps
            // we need to do this because device in bootloader mode misses some features attributes required for updating logic
            // if user disconnects device to connect it in bootloader mode, it opens "device disconnected" modal
            // so prevApp is equal to "firmware" in case the update process started in settings or "onboarding" in case of onboarding
            // moreover we do not want to do it if device was already in bootloader
            // as this can happen only if user disconnected the device again after already being in bootloader mode
            if (
                (prevApp === 'firmware' || prevApp === 'onboarding') &&
                action.payload.mode !== 'bootloader'
            ) {
                api.dispatch(firmwareActions.rememberPreviousDevice(action.payload));
            }
            break;
        default:
    }

    return action;
};
export default firmware;
