/* eslint-disable @typescript-eslint/naming-convention */
import TrezorConnect from 'trezor-connect';
import { addToast } from '@suite-actions/notificationActions';
import * as suiteActions from '@suite-actions/suiteActions';
import * as deviceUtils from '@suite-utils/device';
import * as modalActions from '@suite-actions/modalActions';
import * as routerActions from '@suite-actions/routerActions';
import { Dispatch, GetState } from '@suite-types';
import { DEVICE } from '@suite-constants';
import { SUITE } from '@suite-actions/constants';

export const applySettings =
    (params: Parameters<typeof TrezorConnect.applySettings>[0]) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const { device } = getState().suite;
        if (!device) return;
        const result = await TrezorConnect.applySettings({
            device: {
                path: device.path,
            },
            ...params,
        });
        if (result.success) {
            dispatch(addToast({ type: 'settings-applied' }));
        } else {
            dispatch(addToast({ type: 'error', error: result.payload.error }));
        }

        return result;
    };

export const changePin =
    (params: Parameters<typeof TrezorConnect.changePin>[0] = {}) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const { device } = getState().suite;

        if (!device) return;

        const result = await TrezorConnect.changePin({
            device: {
                path: device.path,
            },
            ...params,
        });
        if (result.success) {
            dispatch(addToast({ type: 'pin-changed' }));
        } else if (result.payload.code === 'Failure_PinMismatch') {
            dispatch(modalActions.openModal({ type: 'pin-mismatch' }));
        } else {
            dispatch(addToast({ type: 'error', error: result.payload.error }));
        }
    };

export const wipeDevice = () => async (dispatch: Dispatch, getState: GetState) => {
    const { device } = getState().suite;
    if (!device) return;
    const bootloaderMode = device.mode === 'bootloader';

    // collect devices with old "device.id" to be removed (see description below)
    const deviceInstances = deviceUtils.getDeviceInstances(device, getState().devices);

    const result = await TrezorConnect.wipeDevice({
        device: {
            path: device.path,
        },
        // In bootloader mode we need the skip the final reload otherwise we never get the resolution
        skipFinalReload: bootloaderMode,
    });

    if (result.success) {
        // Wiping a device triggers device.id change and this change is propagated to device reducer via trezor-connect DEVICE.CHANGE event.
        // Accounts data are related to the old device.id in order to properly clear reducers and indexed db
        // we need to retrieve device objects BEFORE and AFTER the wipe process.
        // and call SUITE.FORGET_DEVICE on ALL devices (with old and new device.id)
        const state = getState();
        const newDevice = state.suite.device;
        deviceInstances.push(...deviceUtils.getDeviceInstances(newDevice!, state.devices));
        deviceInstances.forEach(d => {
            dispatch(suiteActions.forgetDevice(d));
        });
        dispatch(addToast({ type: 'device-wiped' }));

        // special case with webusb. device after wipe changes device_id. with webusb transport, device_id is used as path
        // and thus as descriptor for webusb. So, after device is wiped, in the transport layer, device is still paired
        // through old descriptor but suite already works with a new one. it kinda works but only until we try a new call,
        // typically resetDevice when in onboarding - we get device disconnected error;
        //
        // edit 1: disconnecting the device wiped from bootloader mode is also necessary
        // edit 2: encountered libusb error with bridge 2.0.27. so let's enforce disconnecting for all devices
        dispatch(suiteActions.requestDeviceReconnect());
        if (state.router.app === 'settings') {
            // redirect to index to close the settings and show initial device setup
            dispatch(routerActions.goto('suite-index'));
        }
    } else {
        dispatch(addToast({ type: 'error', error: result.payload.error }));
    }
};

export const resetDevice =
    (params: Parameters<typeof TrezorConnect.resetDevice>[0] = {}) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const { device } = getState().suite;
        if (!device) return;
        let defaults = {};
        if (device.features?.major_version === 1) {
            defaults = {
                strength: DEVICE.DEFAULT_STRENGTH_T1,
                label: DEVICE.DEFAULT_LABEL,
                skip_backup: DEVICE.DEFAULT_SKIP_BACKUP,
                passphrase_protection: DEVICE.DEFAULT_PASSPHRASE_PROTECTION,
            };
        } else {
            defaults = {
                strength: DEVICE.DEFAULT_STRENGTH_T2,
                label: DEVICE.DEFAULT_LABEL,
                skip_backup: DEVICE.DEFAULT_SKIP_BACKUP,
                passphrase_protection: DEVICE.DEFAULT_PASSPHRASE_PROTECTION,
            };
        }

        const result = await TrezorConnect.resetDevice({
            device: {
                path: device.path,
            },
            ...defaults,
            ...params,
        });

        if (result.success && DEVICE.DEFAULT_PASSPHRASE_PROTECTION) {
            // We call resetDevice from onboarding (generating new seed)
            // Uninitialized device has disabled passphrase protection thus useEmptyPassphrase is set to true.
            // It means that when user finished the onboarding process a standard wallet is automatically
            // discovered instead of asking for selecting between standard wallet and a passphrase.
            // This action takes cares of setting useEmptyPassphrase to false (handled by deviceReducer).
            dispatch({ type: SUITE.UPDATE_PASSPHRASE_MODE, payload: device, hidden: true });
        }

        if (!result.success) {
            dispatch(addToast({ type: 'error', error: result.payload.error }));
        }
        return result;
    };
