import {
    getBootloaderVersion,
    getFirmwareVersion,
    hasBitcoinOnlyFirmware,
    isBitcoinOnlyDevice,
} from '@trezor/device-utils';
import { analytics, EventType } from '@trezor/suite-analytics';
import TrezorConnect, { FirmwareType } from '@trezor/connect';
import { createThunk } from '@suite-common/redux-utils';
import { TrezorDevice } from '@suite-common/suite-types';

import { selectFirmware } from './firmwareReducer';
import { FIRMWARE_MODULE_PREFIX, firmwareActions } from './firmwareActions';
import { getBinFilesBaseUrlThunk } from './getBinFilesBaseUrlThunk';

const handleFwHashError = createThunk(
    `${FIRMWARE_MODULE_PREFIX}/handleFwHashError`,
    ({ device, errorMessage }: { device: TrezorDevice; errorMessage: string }, { dispatch }) => {
        // device.id should always be present here (device is initialized and in normal mode) during successful TrezorConnect.getFirmwareHash call
        if (device.id) {
            dispatch(firmwareActions.setHashInvalid(device.id));
        }
        dispatch(
            firmwareActions.setFirmwareUpdateError(
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

export const INVALID_HASH_ERROR = 'Invalid hash';

const handleFwHashMismatch = createThunk(
    `${FIRMWARE_MODULE_PREFIX}/handleFwHashMismatch`,
    (device: TrezorDevice, { dispatch }) => {
        // see `handleFwHashError`
        if (device.id) {
            dispatch(firmwareActions.setHashInvalid(device.id));
        }
        dispatch(firmwareActions.setFirmwareUpdateError(INVALID_HASH_ERROR));
        analytics.report({
            type: EventType.FirmwareValidateHashMismatch,
        });
    },
);

const handleFwHashValid = createThunk(
    `${FIRMWARE_MODULE_PREFIX}/handleFwHashValid`,
    (device: TrezorDevice, { dispatch }) => {
        // see `handleFwHashError`
        if (device.id) {
            dispatch(firmwareActions.clearInvalidHash(device.id));
        }
        dispatch(firmwareActions.setStatus('done'));
        dispatch(firmwareActions.setFirmwareUpdateError(undefined));
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
            dispatch(firmwareActions.setFirmwareUpdateError(undefined));
        }

        if (!device) {
            dispatch(firmwareActions.setStatus('error'));
            dispatch(firmwareActions.setFirmwareUpdateError('Device not connected'));

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
            dispatch(firmwareActions.setFirmwareUpdateError(firmwareUpdateResponse.payload.error));
        } else {
            const { check } = firmwareUpdateResponse.payload;
            if (check === 'mismatch') {
                // hash check was performed, and it does not match, so consider firmware counterfeit
                dispatch(handleFwHashMismatch(device));
            } else if (check === 'other-error') {
                // device failed to respond to the hash check, consider the firmware counterfeit
                dispatch(
                    handleFwHashError({
                        device,
                        errorMessage: firmwareUpdateResponse.payload.checkError,
                    }),
                );
            } else {
                dispatch(handleFwHashValid(device));
            }
        }
    },
);
