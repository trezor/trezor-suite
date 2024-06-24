import {
    getBootloaderVersion,
    getFirmwareVersion,
    hasBitcoinOnlyFirmware,
    isBitcoinOnlyDevice,
} from '@trezor/device-utils';
import { isDesktop } from '@trezor/env-utils';
import { resolveStaticPath } from '@suite-common/suite-utils';
import { analytics, EventType } from '@trezor/suite-analytics';
import TrezorConnect, { Device, FirmwareType } from '@trezor/connect';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';

import { selectFirmware } from './firmwareReducer';
import { FIRMWARE_MODULE_PREFIX, firmwareActions } from './firmwareActions';

const handleFwHashError = createThunk(
    `${FIRMWARE_MODULE_PREFIX}/handleFwHashError`,
    (errorMessage: string, { dispatch }) => {
        dispatch(
            firmwareActions.setError(
                `${errorMessage}. Unable to validate firmware hash. If you want to check authenticity of newly installed firmware please proceed to device settings and reinstall firmware.`,
            ),
        );
        analytics.report({
            type: EventType.FirmwareValidateHashError,
            payload: {
                error: errorMessage,
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

export const firmwareUpdate = createThunk(
    `${FIRMWARE_MODULE_PREFIX}/firmwareUpdate`,
    async (
        { firmwareType, binary }: { firmwareType?: FirmwareType; binary?: ArrayBuffer },
        { dispatch, getState, extra },
    ) => {
        dispatch(firmwareActions.setStatus('started'));

        // Temporarily save target firmware type so that it can be displayed during installation.
        if (firmwareType) {
            dispatch(firmwareActions.setTargetType(firmwareType));
        }

        const {
            selectors: { selectDevice, selectDesktopBinDir, selectLanguage },
        } = extra;

        const device = selectDevice(getState());
        const desktopBinDir = selectDesktopBinDir(getState());
        const suiteLanguage = selectLanguage(getState());
        const { useDevkit, cachedDevice, error } = selectFirmware(getState());

        if (error) {
            dispatch(firmwareActions.setError(undefined));
        }

        if (!device) {
            dispatch(firmwareActions.setStatus('error'));
            dispatch(firmwareActions.setError('Device not connected'));

            return;
        }

        // Cache device when firmware installation starts so that we can reference the original firmware version and type during the installation process.
        // This action is dispatched twice in manual update flow and we only want to cache the device during the first dispatch when it is not yet in bootloader mode.
        if (!cachedDevice) {
            dispatch(firmwareActions.cacheDevice(device));
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
        const targetTranslationLanguage = device.firmwareRelease?.release.translations?.find(
            language => language.startsWith(suiteLanguage),
        );

        const firmwareUpdateResponse = await TrezorConnect.firmwareUpdate({
            device,
            baseUrl,
            btcOnly: toBitcoinOnlyFirmware,
            binary,
            // Firmware language should only be set during the initial firmware installation.
            language: device.firmware === 'none' ? targetTranslationLanguage : undefined,
        });

        // condition to satisfy TS
        if (device.features) {
            const targetProperties = binary
                ? {}
                : {
                      toFwVersion: device?.firmwareRelease?.release.version.join('.'),
                      toBtcOnly: toBitcoinOnlyFirmware,
                  };
            analytics.report({
                type: EventType.DeviceUpdateFirmware,
                payload: {
                    model: device.features.internal_model,
                    fromFwVersion:
                        device?.firmware === 'none' ? 'none' : getFirmwareVersion(device),
                    fromBlVersion: getBootloaderVersion(device),
                    error: !firmwareUpdateResponse.success
                        ? firmwareUpdateResponse.payload.error
                        : '',
                    ...targetProperties,
                },
            });
        }

        if (!firmwareUpdateResponse.success) {
            dispatch(firmwareActions.setStatus('error'));
            dispatch(firmwareActions.setError(firmwareUpdateResponse.payload.error));
        } else {
            const { check } = firmwareUpdateResponse.payload;
            if (check === 'mismatch') {
                handleFwHashMismatch(device);
            } else if (check === 'other-error') {
                // TrezorConnect error. Only 'softly' inform user that we were not able to
                // validate firmware hash
                handleFwHashError(firmwareUpdateResponse.payload.checkError);
            } else {
                dispatch(firmwareActions.setStatus('done'));
            }
        }
    },
);
