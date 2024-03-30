import {
    getBootloaderVersion,
    getFirmwareVersion,
    hasBitcoinOnlyFirmware,
    isBitcoinOnlyDevice,
} from '@trezor/device-utils';
import { Await } from '@trezor/type-utils';
import { isDesktop } from '@trezor/env-utils';
import { resolveStaticPath } from '@suite-common/suite-utils';
import { analytics, EventType } from '@trezor/suite-analytics';
import TrezorConnect, {
    Device,
    DeviceModelInternal,
    FirmwareType,
    Unsuccessful,
} from '@trezor/connect';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';

import {
    selectFirmwareChallenge,
    selectFirmwareHash,
    selectIntermediaryInstalled,
    selectIsCustomFirmware,
    selectPrevDevice,
    selectTargetRelease,
    selectUseDevkit,
} from './firmwareReducer';
import { FIRMWARE_MODULE_PREFIX, firmwareActions } from './firmwareActions';

const handleFwHashError = createThunk(
    `${FIRMWARE_MODULE_PREFIX}/handleFwHashError`,
    (getFirmwareHashResponse: Unsuccessful, { dispatch }) => {
        dispatch(
            firmwareActions.setError(
                `${getFirmwareHashResponse.payload.error}. Unable to validate firmware hash. If you want to check authenticity of newly installed firmware please proceed to device settings and reinstall firmware.`,
            ),
        );
        analytics.report({
            type: EventType.FirmwareValidateHashError,
            payload: {
                error: getFirmwareHashResponse.payload.error,
            },
        });
    },
);

const handleFwHashMismatch = createThunk(
    `${FIRMWARE_MODULE_PREFIX}/handleFwHashMismatch`,
    (device: Device, { dispatch }) => {
        // device.id should always be present here (device is initialized and in normal mode) during successful TrezorConnect.getFirmwareHash call
        dispatch(firmwareActions.setHashInvalid(device.id!));
        dispatch(firmwareActions.setError('Invalid hash'));
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
    `${FIRMWARE_MODULE_PREFIX}/validateFirmwareHash`,
    async (device: Device, { getState, dispatch, extra }) => {
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
            dispatch(firmwareActions.setStatus('validation'));
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
                        'Unknown message', // T1B1
                        'Unexpected message', // T2T1
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
            dispatch(firmwareActions.setStatus('done'));
            // at the moment, this should never happen. after firmware hash is validated using TrezorConnect.getFirmwareHash we know
            // that device has either firmware 1.11.1 or higher or 2.5.1 or higher as this method is not available before that.
            // and we also know that firmware update to the latest version (after 1.11.1 and 2.5.1) is straightforward without any need
            // to update incrementally or using intermediary firmware.
        } else if (['outdated', 'required'].includes(device.firmware!)) {
            dispatch(firmwareActions.setStatus('partially-done'));
        }
    },
);

export const checkFirmwareAuthenticity = createThunk(
    `${FIRMWARE_MODULE_PREFIX}/checkFirmwareAuthenticity`,
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
    `${FIRMWARE_MODULE_PREFIX}/rebootToBootloader`,
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
