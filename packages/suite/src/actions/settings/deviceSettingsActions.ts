/* eslint-disable @typescript-eslint/camelcase */
import TrezorConnect, { ApplySettings, ChangePin, ResetDevice } from 'trezor-connect';
import { addToast } from '@suite-actions/notificationActions';
import * as modalActions from '@suite-actions/modalActions';
import { isWebUSB } from '@suite-utils/transport';

import { Dispatch, GetState } from '@suite-types';

const DEFAULT_LABEL = 'My Trezor';
const DEFAULT_PASSPHRASE_PROTECTION = true;
const DEFAULT_SKIP_BACKUP = true;
const DEFAULT_STRENGTH_T1 = 256;
const DEFAULT_STRENGTH_T2 = 128;

export const applySettings = (params: ApplySettings) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
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

export const changePin = (params: ChangePin = {}) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
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
    const { device, transport } = getState().suite;
    if (!device) return;
    const result = await TrezorConnect.wipeDevice({
        device: {
            path: device.path,
        },
    });

    if (result.success) {
        dispatch(addToast({ type: 'device-wiped' }));
        // special case with webusb. device after wipe changes device_id. with webusb transport, device_id is used as path
        // and thus as descriptor for webusb. So, after device is wiped, in the transport layer, device is still paired
        // through old descriptor but suite already works with a new one. it kinda works but only until we try a new call,
        // typically resetDevice when in onboarding - we get device disconnected error;
        if (isWebUSB(transport)) {
            dispatch(modalActions.openModal({ type: 'disconnect-device' }));
        }
    } else {
        dispatch(addToast({ type: 'error', error: result.payload.error }));
    }
};

export const resetDevice = (params: ResetDevice = {}) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { device } = getState().suite;
    if (!device) return;
    let defaults = {};
    if (device.features?.major_version === 1) {
        defaults = {
            strength: DEFAULT_STRENGTH_T1,
            label: DEFAULT_LABEL,
            skip_backup: DEFAULT_SKIP_BACKUP,
            passphrase_protection: DEFAULT_PASSPHRASE_PROTECTION,
        };
    } else {
        defaults = {
            strength: DEFAULT_STRENGTH_T2,
            label: DEFAULT_LABEL,
            skip_backup: DEFAULT_SKIP_BACKUP,
            passphrase_protection: DEFAULT_PASSPHRASE_PROTECTION,
        };
    }

    const result = await TrezorConnect.resetDevice({
        device: {
            path: device.path,
        },
        ...defaults,
        ...params,
    });
    if (!result.success) {
        dispatch(addToast({ type: 'error', error: result.payload.error }));
    }
    return result;
};
