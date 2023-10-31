import { isAnyOf } from '@reduxjs/toolkit';

import {
    firmwareActions,
    validateFirmwareHash,
    firmwareUpdate,
    selectFirmware,
} from '@suite-common/wallet-core';
import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';

export const prepareFirmwareMiddleware = createMiddlewareWithExtraDeps(
    (action, { getState, dispatch, extra, next }) => {
        const {
            selectors: { selectDevice, selectRouterApp },
            actions: { appChanged, setSelectedDevice, updateSelectedDevice },
        } = extra;
        const firmware = selectFirmware(getState());
        const device = selectDevice(getState());
        const routerApp = selectRouterApp(getState());

        // pass action
        next(action);

        const { status, intermediaryInstalled } = firmware;

        if (appChanged.match(action)) {
            // leaving firmware update context
            if (['firmware', 'firmware-type', 'onboarding'].includes(routerApp)) {
                dispatch(firmwareActions.resetReducer());
            }
        }

        if (isAnyOf(setSelectedDevice, updateSelectedDevice)(action)) {
            // both saved and unsaved device
            // disconnected
            if (status === 'unplug' && (!action.payload || !action.payload?.connected)) {
                // even if we are going to install subsequent update after intermediary fw installation, user doesn't have to hold any buttons, device will be connected in BL anyway
                dispatch(firmwareActions.setStatus('reconnect-in-normal'));
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
                dispatch(firmwareUpdate(firmware.targetType));
                return action;
            }

            // here user connected device that was force remembered before
            if (
                action.payload?.features &&
                action.payload?.connected &&
                action.payload?.mode !== 'bootloader' && // after custom firmware install waiting for confirmation of fingerprint
                ['reconnect-in-normal', 'wait-for-reboot'].includes(status) &&
                !intermediaryInstalled
            ) {
                dispatch(validateFirmwareHash(action.payload));
            }
        }

        switch (action.type) {
            case firmwareActions.setStatus.type: {
                // device should always be connected here - button setting waiting-for-bootloader should be disabled when
                // device is not connected.
                if (['waiting-for-bootloader', 'check-seed'].includes(action.payload) && device) {
                    dispatch(firmwareActions.setTargetRelease(device.firmwareRelease));

                    // remember previous device for firmware type check (regular/bitcoin-only) and analytics
                    dispatch(firmwareActions.rememberPreviousDevice(device));
                }

                break;
            }

            default:
        }

        return action;
    },
);
