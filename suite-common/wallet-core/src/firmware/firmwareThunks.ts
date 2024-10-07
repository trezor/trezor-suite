import {
    getBootloaderVersion,
    getFirmwareVersion,
    hasBitcoinOnlyFirmware,
    isBitcoinOnlyDevice,
} from '@trezor/device-utils';
import { analytics, EventType } from '@trezor/suite-analytics';
import TrezorConnect, { Device, FirmwareType } from '@trezor/connect';
import { createThunk } from '@suite-common/redux-utils';

import { selectFirmware } from './firmwareReducer';
import { FIRMWARE_MODULE_PREFIX, firmwareActions } from './firmwareActions';
import { getBinFilesBaseUrlThunk } from './getBinFilesBaseUrlThunk';

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
            selectors: { selectDevice, selectLanguage },
        } = extra;

        const device = selectDevice(getState());
        const binFilesBaseUrl = await dispatch(getBinFilesBaseUrlThunk()).unwrap();
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

        const baseUrl = `${binFilesBaseUrl}${useDevkit ? '/devkit' : ''}`;

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
