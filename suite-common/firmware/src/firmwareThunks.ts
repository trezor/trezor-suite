import { createThunk } from '@suite-common/redux-utils';
import { TrezorDevice } from '@suite-common/suite-types';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import TrezorConnect, { FirmwareType } from '@trezor/connect';
import { hasBitcoinOnlyFirmware, isBitcoinOnlyDevice } from '@trezor/device-utils';

import { FIRMWARE_MODULE_PREFIX, firmwareActions } from './firmwareActions';
import { selectFirmware } from './firmwareReducer';
import { getBinFilesBaseUrlThunk } from './getBinFilesBaseUrlThunk';

export const INVALID_HASH_ERROR = 'Invalid hash';

type FirmwareUpdateProps = {
    firmwareType?: FirmwareType;
    binary?: ArrayBuffer;
    // used on mobile, we don't have any FWs locally
    ignoreBaseUrl?: boolean;
};

export type FirmwareUpdateResult = {
    device?: TrezorDevice;
    toFwVersion?: string;
    toBtcOnly?: boolean;
    error?: string;
    connectResponse?: Awaited<ReturnType<typeof TrezorConnect.firmwareUpdate>>;
};

// TODO(karliatto): let's do something like getConfigJws
// At startup we need to fetch for the connected device https://data.trezor.io/firmware/t1b1/releases.json
// releases.json has to be signed and we will check the signature as we do with system-messages - how is going to do that? we?
// Once we get it, we check if the bundled firmware is the latest one
// If it is not the latest one we download the new one and tell the user to upgrade it.

export const fetchLatestFirmwareThunk = createThunk<
    any,
    any,
    { rejectValue: FirmwareUpdateResult }
>(
    `${FIRMWARE_MODULE_PREFIX}/fetchLatestFirmwareThunk`,
    async (
        { firmwareType, binary, features, ignoreBaseUrl = false },
        { dispatch, getState, extra, fulfillWithValue, rejectWithValue },
    ) => {
        console.log('fetchLatestFirmwareThunk in firmwreThunks.ts');

        console.log('firmwareType', firmwareType);

        console.log('features.internal_model', features.internal_model);
        // TODO: first just check if there is newer version in releases.json of the model and then tell the user.
        // TODO: downloading the file has to happen in connect that in desktop runs in main process.
        // Let's use downloadFile form @trezor/node-utils
    },
);

export const firmwareUpdate = createThunk<
    FirmwareUpdateResult,
    FirmwareUpdateProps,
    { rejectValue: FirmwareUpdateResult }
>(
    `${FIRMWARE_MODULE_PREFIX}/firmwareUpdate`,
    async (
        { firmwareType, binary, ignoreBaseUrl = false },
        { dispatch, getState, extra, fulfillWithValue, rejectWithValue },
    ) => {
        console.log('firmwareUpdate in firmwareThunks.ts');
        dispatch(firmwareActions.setStatus('started'));

        // Temporarily save target firmware type so that it can be displayed during installation.
        if (firmwareType) {
            dispatch(firmwareActions.setTargetType(firmwareType));
        }

        const {
            selectors: { selectLanguage },
            utils: { reportCheckFail },
        } = extra;

        const device = selectSelectedDevice(getState());
        console.log('device', device);
        const binFilesBaseUrl = await dispatch(getBinFilesBaseUrlThunk()).unwrap();
        console.log('binFilesBaseUrl in firmwareUpdate in firmwareThunks.ts', binFilesBaseUrl);
        const suiteLanguage = selectLanguage(getState());
        const { useDevkit, cachedDevice, error } = selectFirmware(getState());

        if (error) {
            dispatch(firmwareActions.setFirmwareUpdateError(undefined));
        }

        if (!device) {
            dispatch(firmwareActions.setStatus('error'));
            dispatch(firmwareActions.setFirmwareUpdateError('Device not connected'));

            return rejectWithValue({
                error: 'Device not connected',
            });
        }

        // Cache device when firmware installation starts so that we can reference the original firmware version and type during the installation process.
        // This action is dispatched twice in manual update flow and we only want to cache the device during the first dispatch when it is not yet in bootloader mode.
        if (!cachedDevice) {
            dispatch(firmwareActions.cacheDevice(device));
        }

        const baseUrl = ignoreBaseUrl
            ? undefined
            : `${binFilesBaseUrl}${useDevkit ? '/devkit' : ''}`;

        console.log('baseUrl in firmwareThunks.ts', baseUrl);

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
        console.log('targetFirmwareType', targetFirmwareType);
        const toBitcoinOnlyFirmware = targetFirmwareType === FirmwareType.BitcoinOnly;
        console.log('toBitcoinOnlyFirmware', toBitcoinOnlyFirmware);
        const targetTranslationLanguage = device.firmwareRelease?.release.translations?.find(
            language => language.startsWith(suiteLanguage),
        );
        console.log('device in firmwareThunks.ts', device);

        const firmwareUpdateResponse = await TrezorConnect.firmwareUpdate({
            device,
            btcOnly: toBitcoinOnlyFirmware,
            binary,
            baseUrl,
            // Firmware language should only be set during the initial firmware installation.
            language: device.firmware === 'none' ? targetTranslationLanguage : undefined,
        });

        const targetProperties = binary
            ? {}
            : {
                  toFwVersion: device?.firmwareRelease?.release.version.join('.'),
                  toBtcOnly: toBitcoinOnlyFirmware,
              };

        if (!firmwareUpdateResponse.success) {
            dispatch(firmwareActions.setStatus('error'));
            dispatch(firmwareActions.setFirmwareUpdateError(firmwareUpdateResponse.payload.error));

            return rejectWithValue({
                device,
                ...targetProperties,
                ...firmwareUpdateResponse.payload,
                connectResponse: firmwareUpdateResponse,
            });
        } else {
            const {
                versionCheck,
                bootloaderVersion,
                binaryVersion,
                installedVersion,
                releaseVersion,
            } = firmwareUpdateResponse.payload;

            dispatch(firmwareActions.setStatus('done'));

            // TODO: Add to the if-else block above and add handle in UI.
            if (!binary && !versionCheck) {
                reportCheckFail('Firmware version', {
                    model: device.features?.internal_model,
                    revision: device.features?.revision,
                    vendor: device.features?.fw_vendor,
                    bootloaderVersion,
                    binaryVersion,
                    installedVersion,
                    releaseVersion,
                    error: 'Unexpected firmware version change during firmware update.',
                });
            }

            return fulfillWithValue({
                device,
                ...targetProperties,
                connectResponse: firmwareUpdateResponse,
            });
        }
    },
);
