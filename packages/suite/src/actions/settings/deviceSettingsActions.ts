/* eslint-disable @typescript-eslint/camelcase */
import TrezorConnect, { ApplySettings, ChangePin, ResetDevice } from 'trezor-connect';
import { addToast } from '@suite-actions/notificationActions';
import * as modalActions from '@suite-actions/modalActions';

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
    const { device } = getState().suite;
    if (!device) return;
    const result = await TrezorConnect.wipeDevice({
        device: {
            path: device.path,
        },
    });

    if (result.success) {
        dispatch(addToast({ type: 'device-wiped' }));
    } else {
        dispatch(addToast({ type: 'error', error: result.payload.error }));
    }

    // todo: evaluate in future, see https://github.com/trezor/trezor-suite/issues/1064
    // if (result.success && device && device.features) {
    //     dispatch({
    //         type: SUITE.REQUEST_DISCONNECT_DEVICE,
    //         payload: device,
    //     });
    // }
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
    if (result.success) {
        dispatch(addToast({ type: 'settings-applied' }));
    } else {
        dispatch(addToast({ type: 'error', error: result.payload.error }));
    }
    return result;
};
