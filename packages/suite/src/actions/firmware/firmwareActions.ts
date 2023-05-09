import TrezorConnect, { Device, Unsuccessful } from '@trezor/connect';
import { analytics, EventType } from '@trezor/suite-analytics';
import { resolveStaticPath } from '@suite-common/suite-utils';

import { FIRMWARE } from '@firmware-actions/constants';
import { isDesktop } from '@suite-utils/env';
import { notificationsActions } from '@suite-common/toast-notifications';

import { Dispatch, GetState, AppState, AcquiredDevice, FirmwareType } from '@suite-types';
import type { Await } from '@trezor/type-utils';
import {
    getFirmwareVersion,
    getBootloaderVersion,
    getDeviceModel,
    DeviceModel,
} from '@trezor/device-utils';

export type FirmwareAction =
    | {
          type: typeof FIRMWARE.SET_UPDATE_STATUS;
          payload: ReturnType<GetState>['firmware']['status'];
      }
    | { type: typeof FIRMWARE.SET_HASH; payload: { hash: string; challenge: string } }
    | { type: typeof FIRMWARE.SET_HASH_INVALID; payload: string }
    | { type: typeof FIRMWARE.SET_TARGET_RELEASE; payload: AcquiredDevice['firmwareRelease'] }
    | { type: typeof FIRMWARE.RESET_REDUCER }
    | { type: typeof FIRMWARE.ENABLE_REDUCER; payload: boolean }
    | { type: typeof FIRMWARE.SET_INTERMEDIARY_INSTALLED; payload: boolean }
    | { type: typeof FIRMWARE.SET_TARGET_TYPE; payload: FirmwareType }
    | { type: typeof FIRMWARE.SET_ERROR; payload?: string }
    | { type: typeof FIRMWARE.TOGGLE_HAS_SEED }
    | { type: typeof FIRMWARE.REMEMBER_PREVIOUS_DEVICE; payload: Device }
    | { type: typeof FIRMWARE.SET_IS_CUSTOM; payload: boolean }
    | { type: typeof FIRMWARE.TOGGLE_USE_DEVKIT; payload: boolean };

export const resetReducer = (): FirmwareAction => ({
    type: FIRMWARE.RESET_REDUCER,
});

export const setStatus = (payload: AppState['firmware']['status']): FirmwareAction => ({
    type: FIRMWARE.SET_UPDATE_STATUS,
    payload,
});

export const setTargetRelease = (payload: AcquiredDevice['firmwareRelease']): FirmwareAction => ({
    type: FIRMWARE.SET_TARGET_RELEASE,
    payload,
});

/**
 * This action will install firmware from the given binary, or the latest
 * possible firmware if the given binary is undefined. The function is not
 * directly exported due to type safety.
 */
const firmwareInstall =
    (fwBinary?: ArrayBuffer, firmwareType?: FirmwareType) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const { device } = getState().suite;
        const { targetRelease, prevDevice, useDevkit, intermediaryInstalled } = getState().firmware;

        if (fwBinary) {
            dispatch({ type: FIRMWARE.SET_IS_CUSTOM, payload: true });
        }

        if (!device || !device.connected || !device.features) {
            dispatch({ type: FIRMWARE.SET_ERROR, payload: 'no device connected' });
            return;
        }

        if (device.mode !== 'bootloader') {
            dispatch({
                type: FIRMWARE.SET_ERROR,
                payload: 'device must be connected in bootloader mode',
            });
            return;
        }

        dispatch(setStatus('started'));

        const deviceModel = getDeviceModel(device);

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
            let toBitcoinOnlyFirmware = firmwareType === FirmwareType.BitcoinOnly;
            if (!firmwareType) {
                toBitcoinOnlyFirmware = !prevDevice
                    ? false
                    : prevDevice.firmwareType === 'bitcoin-only';
            }

            const targetFirmwareVersion = release.version.join('.');

            console.warn(
                intermediaryVersion
                    ? `Cannot install latest firmware. Will install intermediary v${intermediaryVersion} instead.`
                    : `Installing ${
                          toBitcoinOnlyFirmware ? FirmwareType.BitcoinOnly : FirmwareType.Universal
                      } firmware ${targetFirmwareVersion}.`,
            );

            analyticsPayload = {
                toFwVersion: targetFirmwareVersion,
                toBtcOnly: toBitcoinOnlyFirmware,
            };

            // temporarily save target firmware type so that it can be displayed during installation and restart
            // the value resets to undefined on firmwareActions.resetReducer() - doing it here would be too early because we need to keep it during the restart
            if (firmwareType) {
                dispatch({ type: FIRMWARE.SET_TARGET_TYPE, payload: firmwareType });
            }

            // FW binaries are stored in "*/static/connect/data/firmware/*/*.bin". see "connect-common" package
            const baseUrl = `${
                isDesktop() ? getState().desktop?.paths.binDir : resolveStaticPath('connect/data')
            }${useDevkit ? '/devkit' : ''}`;

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
                    dispatch({ type: FIRMWARE.SET_INTERMEDIARY_INSTALLED, payload: true });
                } else if (intermediaryInstalled) {
                    // set to false so validateFirmwareHash can be triggerd from firmwareMiddleware
                    dispatch({ type: FIRMWARE.SET_INTERMEDIARY_INSTALLED, payload: false });
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
            return dispatch({ type: FIRMWARE.SET_ERROR, payload: updateResponse.payload.error });
        }
        dispatch({ type: FIRMWARE.SET_HASH, payload: updateResponse.payload });

        // T1
        // ask user to unplug device if BL < 1.10.0 (see firmwareMiddleware), BL starting with 1.10.0 will automatically restart itself just like on TT
        // TT without pin
        // ask user to wait until device reboots
        dispatch(
            setStatus(
                deviceModel === DeviceModel.T1 && device.features.minor_version < 10
                    ? 'unplug'
                    : 'wait-for-reboot',
            ),
        );
    };

export const firmwareUpdate = (firmwareType?: FirmwareType) =>
    firmwareInstall(undefined, firmwareType);

const handleFwHashError = (dispatch: Dispatch, getFirmwareHashResponse: Unsuccessful) => {
    dispatch({
        type: FIRMWARE.SET_ERROR,
        payload: `${getFirmwareHashResponse.payload.error}. Unable to validate firmware hash. If you want to check authenticity of newly installed firmware please proceed to device settings and reinstall firmware.`,
    });
    analytics.report({
        type: EventType.FirmwareValidateHashError,
        payload: {
            error: getFirmwareHashResponse.payload.error,
        },
    });
};

const handleFwHashMismatch = (dispatch: Dispatch, device: Device) => {
    dispatch({
        type: FIRMWARE.SET_HASH_INVALID,
        // device.id should always be present here (device is initialized and in normal mode) during successful TrezorConnect.getFirmwareHash call
        payload: device.id!,
    });
    dispatch({ type: FIRMWARE.SET_ERROR, payload: 'Invalid hash' });
    analytics.report({
        type: EventType.FirmwareValidateHashMismatch,
    });
};

/**
 * After installing a new firmware validate its hash (already saved into application state) with the result of
 * TrezorConnect.getFirmwareHash call
 */
export const validateFirmwareHash =
    (device: Device) => async (dispatch: Dispatch, getState: GetState) => {
        const { app: prevApp } = getState().router;
        const { firmwareChallenge, firmwareHash, isCustom } = getState().firmware;

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
                    handleFwHashMismatch(dispatch, device);
                } else {
                    // TrezorConnect error. Only 'softly' inform user that we were not able to
                    // validate firmware hash
                    handleFwHashError(dispatch, fwHash);
                }
                return;
            }

            if (fwHash.payload.hash !== firmwareHash) {
                handleFwHashMismatch(dispatch, device);
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
    };

export const checkFirmwareAuthenticity = () => async (dispatch: Dispatch, getState: GetState) => {
    const { device } = getState().suite;
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
};

export const firmwareCustom = (fwBinary: ArrayBuffer) => firmwareInstall(fwBinary);

export const toggleHasSeed = (): FirmwareAction => ({
    type: FIRMWARE.TOGGLE_HAS_SEED,
});

export const rememberPreviousDevice = (device: Device) => ({
    type: FIRMWARE.REMEMBER_PREVIOUS_DEVICE,
    payload: device,
});

export const rebootToBootloader = () => async (dispatch: Dispatch, getState: GetState) => {
    const { device } = getState().suite;

    if (!device) return;

    const response = await TrezorConnect.rebootToBootloader({
        device: {
            path: device.path,
        },
    });

    if (!response.success) {
        dispatch(notificationsActions.addToast({ type: 'error', error: response.payload.error }));
    }

    return response;
};

export const toggleUseDevkit = (useDevkit: boolean): FirmwareAction => ({
    type: FIRMWARE.TOGGLE_USE_DEVKIT,
    payload: useDevkit,
});
