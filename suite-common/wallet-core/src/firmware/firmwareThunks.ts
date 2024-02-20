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
import { firmwareActionsPrefix, firmwareActions } from './firmwareActions';

/**
 * This action will install firmware from the given binary, or the latest
 * possible firmware if the given binary is undefined. The function is not
 * directly exported due to type safety.
 */
const firmwareInstallThunk = createThunk(
    `${firmwareActionsPrefix}/firmwareInstall`,
    async (
        { fwBinary, firmwareType }: { fwBinary?: ArrayBuffer; firmwareType?: FirmwareType },
        { dispatch, getState, extra },
    ) => {
        const {
            selectors: { selectDesktopBinDir, selectDevice },
        } = extra;
        const device = selectDevice(getState());
        const targetRelease = selectTargetRelease(getState());
        const prevDevice = selectPrevDevice(getState());
        const useDevkit = selectUseDevkit(getState());
        const intermediaryInstalled = selectIntermediaryInstalled(getState());
        const desktopBinDir = selectDesktopBinDir(getState());

        if (fwBinary) {
            dispatch(firmwareActions.setIsCustomFirmware(true));
        }

        if (!device || !device.connected || !device.features) {
            dispatch({ type: firmwareActions.setError.type, payload: 'no device connected' });

            return;
        }

        if (device.mode !== 'bootloader') {
            dispatch({
                type: firmwareActions.setError.type,
                payload: 'device must be connected in bootloader mode',
            });

            return;
        }

        dispatch(firmwareActions.setStatus('started'));

        const deviceModelInternal = device.features.internal_model;

        const fromFwVersion =
            prevDevice && prevDevice.features && prevDevice.firmware !== 'none'
                ? getFirmwareVersion(prevDevice)
                : 'none';
        const fromBlVersion = getBootloaderVersion(device);

        let updateResponse: Await<ReturnType<typeof TrezorConnect.firmwareUpdate>>;
        let analyticsPayload;

        if (fwBinary) {
            console.warn(`Installing custom firmware`);

            // todo: what about firmware hash ?
            analyticsPayload = {};
            updateResponse = await TrezorConnect.firmwareUpdate({
                keepSession: false,
                skipFinalReload: true,
                device: {
                    path: device.path,
                },
                binary: fwBinary,
            });
        } else {
            // for update (in firmware modal) target release is set. otherwise use device.firmwareRelease
            const toRelease = targetRelease || device.firmwareRelease;

            if (!toRelease) return;

            const { release, intermediaryVersion } = toRelease;

            // update to same variant as is currently installed or to the regular one if device does not have any fw (new/wiped device),
            // unless the user wants to switch firmware type
            const getTargetFirmwareType = () => {
                if (firmwareType) {
                    return firmwareType;
                }

                return hasBitcoinOnlyFirmware(prevDevice) || isBitcoinOnlyDevice(prevDevice)
                    ? FirmwareType.BitcoinOnly
                    : FirmwareType.Regular;
            };

            const targetFirmwareType = getTargetFirmwareType();
            const toBitcoinOnlyFirmware = targetFirmwareType === FirmwareType.BitcoinOnly;

            const targetFirmwareVersion = release.version.join('.');

            console.warn(
                intermediaryVersion
                    ? `Cannot install latest firmware. Will install intermediary v${intermediaryVersion} instead.`
                    : `Installing ${targetFirmwareType} firmware ${targetFirmwareVersion}.`,
            );

            analyticsPayload = {
                toFwVersion: targetFirmwareVersion,
                toBtcOnly: toBitcoinOnlyFirmware,
            };

            // temporarily save target firmware type so that it can be displayed during installation and restart
            // the value resets to undefined on firmwareActions.resetReducer() - doing it here would be too early because we need to keep it during the restart
            if (firmwareType) {
                dispatch(firmwareActions.setTargetType(firmwareType));
            }

            // FW binaries are stored in "*/static/connect/data/firmware/*/*.bin". see "connect-common" package
            const baseUrl = `${isDesktop() ? desktopBinDir : resolveStaticPath('connect/data')}${
                useDevkit ? '/devkit' : ''
            }`;

            updateResponse = await TrezorConnect.firmwareUpdate({
                keepSession: false,
                skipFinalReload: true,
                device: {
                    path: device.path,
                },
                baseUrl,
                btcOnly: toBitcoinOnlyFirmware,
                version: release.version,
                intermediaryVersion,
            });
            if (updateResponse.success) {
                if (intermediaryVersion) {
                    dispatch(firmwareActions.setIntermediaryInstalled(true));
                } else if (intermediaryInstalled) {
                    // set to false so validateFirmwareHash can be triggerd from firmwareMiddleware
                    dispatch(firmwareActions.setIntermediaryInstalled(false));
                }
            }
        }

        analytics.report({
            type: EventType.DeviceUpdateFirmware,
            payload: {
                fromFwVersion,
                fromBlVersion,
                error: !updateResponse.success ? updateResponse.payload.error : '',
                ...analyticsPayload,
            },
        });

        if (!updateResponse.success) {
            return dispatch({
                type: firmwareActions.setError.type,
                payload: updateResponse.payload.error,
            });
        }
        dispatch({ type: firmwareActions.setHash.type, payload: updateResponse.payload });

        // T1B1
        // ask user to unplug device if BL < 1.10.0 (see firmwareMiddleware), BL starting with 1.10.0 will automatically restart itself just like on T2T1
        // T2T1 without pin
        // ask user to wait until device reboots
        dispatch(
            firmwareActions.setStatus(
                deviceModelInternal === DeviceModelInternal.T1B1 &&
                    device.features.minor_version < 10
                    ? 'unplug'
                    : 'wait-for-reboot',
            ),
        );
    },
);

export const firmwareUpdate = (firmwareType?: FirmwareType) =>
    firmwareInstallThunk({ fwBinary: undefined, firmwareType });

export const firmwareCustom = (fwBinary: ArrayBuffer) => firmwareInstallThunk({ fwBinary });

const handleFwHashError = createThunk(
    `${firmwareActionsPrefix}/handleFwHashError`,
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
    `${firmwareActionsPrefix}/handleFwHashMismatch`,
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
    `${firmwareActionsPrefix}/validateFirmwareHash`,
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
    `${firmwareActionsPrefix}/checkFirmwareAuthenticity`,
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
    `${firmwareActionsPrefix}/rebootToBootloader`,
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
