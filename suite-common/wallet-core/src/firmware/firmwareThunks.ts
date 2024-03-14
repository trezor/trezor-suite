import { hasBitcoinOnlyFirmware, isBitcoinOnlyDevice } from '@trezor/device-utils';
import { isDesktop } from '@trezor/env-utils';
import { resolveStaticPath } from '@suite-common/suite-utils';
import { analytics, EventType } from '@trezor/suite-analytics';
import TrezorConnect, { Device, FirmwareType, Unsuccessful } from '@trezor/connect';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';

import { selectUseDevkit } from './firmwareReducer';
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

export const firmwareUpdate_v2 = createThunk(
    `${FIRMWARE_MODULE_PREFIX}/firmwareUpdate_v2`,
    async (
        { firmwareType, binary }: { firmwareType?: FirmwareType; binary?: ArrayBuffer },
        { dispatch, getState, extra },
    ) => {
        dispatch(firmwareActions.setStatus('started'));

        console.log('firmwareUpdate_v2', firmwareType);
        const {
            selectors: { selectDevice, selectDesktopBinDir },
        } = extra;

        const device = selectDevice(getState());
        const useDevkit = selectUseDevkit(getState());
        const desktopBinDir = selectDesktopBinDir(getState());
        if (!device) {
            throw new Error('device is not connected');
        }

        // FW binaries are stored in "*/static/connect/data/firmware/*/*.bin". see "connect-common" package
        const baseUrl = `${isDesktop() ? desktopBinDir : resolveStaticPath('connect/data')}${
            useDevkit ? '/devkit' : ''
        }`;

        // update to same variant as is currently installed or to the regular one if device does not have any fw (new/wiped device),
        // unless the user wants to switch firmware type
        const getTargetFirmwareType = () => {
            if (firmwareType) {
                return firmwareType;
            }

            return hasBitcoinOnlyFirmware(device) || isBitcoinOnlyDevice(device)
                ? FirmwareType.BitcoinOnly
                : FirmwareType.Regular;
        };

        const targetFirmwareType = getTargetFirmwareType();
        const toBitcoinOnlyFirmware = targetFirmwareType === FirmwareType.BitcoinOnly;

        const firmwareUpdateReponse = await TrezorConnect.firmwareUpdate_v2({
            device,

            // from outside connect we need to know:
            baseUrl,

            // language probably optional (only if it should be changed)
            language: 'de-DE',
            // btc only probably optional (only if it should be changed)
            btcOnly: toBitcoinOnlyFirmware,
            // todo: how about custom fw?
            binary,
        });

        console.log('firmwareUpdateReponse: ', firmwareUpdateReponse);
        if (!firmwareUpdateReponse.success) {
            dispatch(firmwareActions.setStatus('error'));
            dispatch(firmwareActions.setError(firmwareUpdateReponse.payload.error));
        } else {
            const { check } = firmwareUpdateReponse.payload;
            if (check === 'mismatch') {
                handleFwHashMismatch(device);
            } else if (check === 'other-error') {
                // TrezorConnect error. Only 'softly' inform user that we were not able to
                // validate firmware hash
                handleFwHashError(firmwareUpdateReponse.payload.checkError);
            } else {
                dispatch(firmwareActions.setStatus('done'));
            }
        }
    },
);
