import { createAction } from '@reduxjs/toolkit';

import TrezorConnect, { Device, Unsuccessful } from '@trezor/connect';
import { analytics, EventType } from '@trezor/suite-analytics';
import { notificationsActions } from '@suite-common/toast-notifications';
import { createThunk } from '@suite-common/redux-utils';
import { FirmwareType, AcquiredDevice } from '@suite-common/suite-types';

import {
    FirmwareStatus,
    selectFirmwareChallenge,
    selectFirmwareHash,
    selectIsCustomFirmware,
} from 'src/reducers/firmware/firmwareReducer';

const MODULE_PREFIX = '@firmware';

const setStatus = createAction(
    `${MODULE_PREFIX}/set-update-status`,
    (payload: FirmwareStatus | 'error') => ({ payload }),
);

const setHash = createAction(
    `${MODULE_PREFIX}/set-hash`,
    (payload: { hash: string; challenge: string }) => ({ payload }),
);

const setHashInvalid = createAction(`${MODULE_PREFIX}/set-hash-invalid`, (payload: string) => ({
    payload,
}));

const setError = createAction(`${MODULE_PREFIX}/set-error`, (payload?: string) => ({
    payload,
}));

const setTargetRelease = createAction(
    `${MODULE_PREFIX}/set-target-release`,
    (payload: AcquiredDevice['firmwareRelease']) => ({ payload }),
);

const toggleHasSeed = createAction(`${MODULE_PREFIX}/toggle-has-seed`);

const setIntermediaryInstalled = createAction(
    `${MODULE_PREFIX}/set-intermediary-installed`,
    (payload: boolean) => ({ payload }),
);

const setTargetType = createAction(`${MODULE_PREFIX}/set-target-type`, (payload: FirmwareType) => ({
    payload,
}));

const rememberPreviousDevice = createAction(
    `${MODULE_PREFIX}/remember-previous-device`,
    (payload: Device) => ({ payload }),
);

const setIsCustomFirmware = createAction(`${MODULE_PREFIX}/set-is-custom`, (payload: boolean) => ({
    payload,
}));

const resetReducer = createAction(`${MODULE_PREFIX}/reset-reducer`);

const toggleUseDevkit = createAction(`${MODULE_PREFIX}/toggle-use-devkit`, (payload: boolean) => ({
    payload,
}));

const handleFwHashError = createThunk(
    `${MODULE_PREFIX}/handleFwHashError`,
    (getFirmwareHashResponse: Unsuccessful, { dispatch }) => {
        dispatch({
            type: setError.type,
            payload: `${getFirmwareHashResponse.payload.error}. Unable to validate firmware hash. If you want to check authenticity of newly installed firmware please proceed to device settings and reinstall firmware.`,
        });
        analytics.report({
            type: EventType.FirmwareValidateHashError,
            payload: {
                error: getFirmwareHashResponse.payload.error,
            },
        });
    },
);

const handleFwHashMismatch = createThunk(
    `${MODULE_PREFIX}/handleFwHashMismatch`,
    (device: Device, { dispatch }) => {
        dispatch({
            type: setHashInvalid.type,
            // device.id should always be present here (device is initialized and in normal mode) during successful TrezorConnect.getFirmwareHash call
            payload: device.id!,
        });
        dispatch({ type: setError.type, payload: 'Invalid hash' });
        analytics.report({
            type: EventType.FirmwareValidateHashMismatch,
        });
    },
);

/**
 * After installing a new firmware validate its hash (already saved into application state) with the result of
 * TrezorConnect.getFirmwareHash call
 */
export const validateFirmwareHash = createThunk(
    `${MODULE_PREFIX}/validateFirmwareHash`,
    async (device: Device, { dispatch, getState, extra }) => {
        const {
            selectors: { selectRouterApp },
        } = extra;
        const prevApp = selectRouterApp(getState());
        const firmwareChallenge = selectFirmwareChallenge(getState());
        const firmwareHash = selectFirmwareHash(getState());
        const isCustom = selectIsCustomFirmware(getState());

        if (!firmwareChallenge || !firmwareHash) {
            // prevent false positives of invalid firmware hash. this should never happen though
            console.error('firmwareChallenge or firmwareHash is missing');
            return;
        }

        if (!isCustom) {
            dispatch(setStatus('validation'));
            const fwHash = await TrezorConnect.getFirmwareHash({
                device: {
                    path: device.path,
                },
                challenge: firmwareChallenge,
            });

            // TODO: move this logic partially into TrezorConnect as described here:
            // https://github.com/trezor/trezor-suite/issues/5896
            // we don't want to have false negatives but more importantly false positives.
            // Cases that should not lead to the big red error:
            // - device disconnected, broken cable
            // - errors from TrezorConnect in general
            // Cases that should lead to the big red error:
            // - device was unable to process 'GetFirmwareHash' message ('Unknown message')
            // - errors from device in general
            if (!fwHash.success) {
                // Device error
                // todo: add a more generic way how to handle all device errors
                if (
                    [
                        'Unknown message', // T1
                        'Unexpected message', // TT
                    ].includes(fwHash.payload.error)
                ) {
                    handleFwHashMismatch(device);
                } else {
                    // TrezorConnect error. Only 'softly' inform user that we were not able to
                    // validate firmware hash
                    handleFwHashError(fwHash);
                }
                return;
            }

            if (fwHash.payload.hash !== firmwareHash) {
                handleFwHashMismatch(device);
                return;
            }
        }

        // last version of firmware or custom firmware version was installed
        if (
            device.firmware === 'valid' ||
            (device.firmware === 'outdated' && prevApp === 'firmware-custom')
        ) {
            dispatch(setStatus('done'));
            // at the moment, this should never happen. after firmware hash is validated using TrezorConnect.getFirmwareHash we know
            // that device has either firmware 1.11.1 or higher or 2.5.1 or higher as this method is not available before that.
            // and we also know that firmware update to the latest version (after 1.11.1 and 2.5.1) is straightforward without any need
            // to update incrementally or using intermediary firmware.
        } else if (['outdated', 'required'].includes(device.firmware!)) {
            dispatch(setStatus('partially-done'));
        }
    },
);

export const checkFirmwareAuthenticity = createThunk(
    `${MODULE_PREFIX}/checkFirmwareAuthenticity`,
    async (_, { dispatch, getState, extra }) => {
        const {
            selectors: { selectDevice },
        } = extra;
        const device = selectDevice(getState());
        if (!device) {
            throw new Error('device is not connected');
        }
        const result = await TrezorConnect.checkFirmwareAuthenticity({
            device: {
                path: device.path,
            },
        });
        if (result.success) {
            if (result.payload.valid) {
                dispatch(
                    notificationsActions.addToast({ type: 'firmware-check-authenticity-success' }),
                );
            } else {
                dispatch(
                    notificationsActions.addToast({
                        type: 'error',
                        error: 'Firmware is not authentic!!!',
                    }),
                );
            }
        } else {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: `Unable to validate firmware: ${result.payload.error}`,
                }),
            );
        }
    },
);

export const rebootToBootloader = createThunk(
    `${MODULE_PREFIX}/rebootToBootloader`,
    async (_, { dispatch, getState, extra }) => {
        const {
            selectors: { selectDevice },
        } = extra;
        const device = selectDevice(getState());

        if (!device) return;

        const response = await TrezorConnect.rebootToBootloader({
            device: {
                path: device.path,
            },
        });

        if (!response.success) {
            dispatch(
                notificationsActions.addToast({ type: 'error', error: response.payload.error }),
            );
        }

        return response;
    },
);

export const firmwareActions = {
    setStatus,
    setHash,
    setHashInvalid,
    setError,
    setTargetRelease,
    toggleHasSeed,
    setIntermediaryInstalled,
    setTargetType,
    rememberPreviousDevice,
    setIsCustomFirmware,
    resetReducer,
    toggleUseDevkit,
};
