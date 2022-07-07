import TrezorConnect, { Device } from '@trezor/connect';
import { analytics, EventType } from '@trezor/suite-analytics';

import { FIRMWARE } from '@firmware-actions/constants';
import { getBootloaderVersion, getFwVersion, isBitcoinOnly } from '@suite-utils/device';
import { resolveStaticPath } from '@trezor/utils';
import { addToast } from '@suite-actions/notificationActions';

import type { Dispatch, GetState, AppState, AcquiredDevice } from '@suite-types';
import type { Await } from '@suite/types/utils';

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
    | { type: typeof FIRMWARE.SET_ERROR; payload?: string }
    | { type: typeof FIRMWARE.TOGGLE_HAS_SEED }
    | { type: typeof FIRMWARE.REMEMBER_PREVIOUS_DEVICE; payload: Device };

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
    (fwBinary?: ArrayBuffer) => async (dispatch: Dispatch, getState: GetState) => {
        const { device } = getState().suite;
        const { targetRelease, prevDevice } = getState().firmware;

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

        const model = device.features.major_version;

        const fromFwVersion =
            prevDevice && prevDevice.features && prevDevice.firmware !== 'none'
                ? getFwVersion(prevDevice)
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

            // update to same variant as is currently installed or to the regular one if device does not have any fw (new/wiped device)
            const isBtcOnlyFirmware = !prevDevice ? false : isBitcoinOnly(prevDevice);

            const intermediary = model === 1 && !toRelease.isLatest;
            if (intermediary) {
                console.warn(
                    'Cannot install latest firmware. Will install intermediary fw instead.',
                );
            } else {
                console.warn(`Installing firmware ${toRelease.release.version}`);
            }

            analyticsPayload = {
                toFwVersion: toRelease.release.version.join('.'),
                toBtcOnly: isBtcOnlyFirmware,
            };

            updateResponse = await TrezorConnect.firmwareUpdate({
                keepSession: false,
                skipFinalReload: true,
                device: {
                    path: device.path,
                },
                // FW binaries are stored in "*/static/connect/data/firmware/*/*.bin". see "connect-common" package
                baseUrl: resolveStaticPath('connect/data'),
                btcOnly: isBtcOnlyFirmware,
                version: toRelease.release.version,
                // if we detect latest firmware may not be used right away, we should use intermediary instead
                intermediary,
            });

            if (updateResponse.success && intermediary) {
                dispatch({ type: FIRMWARE.SET_INTERMEDIARY_INSTALLED, payload: true });
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

        // model 1
        // ask user to unplug device if BL < 1.10.0 (see firmwareMiddleware), BL starting with 1.10.0 will automatically restart itself just like on model T
        // model 2 without pin
        // ask user to wait until device reboots
        dispatch(
            setStatus(
                model === 1 && device.features.minor_version < 10 ? 'unplug' : 'wait-for-reboot',
            ),
        );
    };

export const firmwareUpdate = () => firmwareInstall();

/**
 * After installing a new firmware validate its hash (already saved into application state) with the result of
 * TrezorConnect.getFirmwareHash call
 */
export const validateFirmwareHash =
    (device: Device) => async (dispatch: Dispatch, getState: GetState) => {
        const { app: prevApp } = getState().router;
        const { firmwareChallenge, firmwareHash } = getState().firmware;

        dispatch(setStatus('validation'));
        const fwHash = await TrezorConnect.getFirmwareHash({
            device: {
                path: device.path,
            },
            challenge: firmwareChallenge,
        });
        if (!fwHash.success) {
            dispatch({
                type: FIRMWARE.SET_ERROR,
                payload: 'Unable to validate firmware hash. Please reinstall firmware again',
            });
            return;
        }

        if (fwHash.payload.hash !== firmwareHash) {
            dispatch({
                type: FIRMWARE.SET_HASH_INVALID,
                // device.id should always be present here (device is initialized and in normal mode) during successful TrezorConnect.getFirmwareHash call
                payload: device.id!,
            });
            dispatch({ type: FIRMWARE.SET_ERROR, payload: 'Invalid hash' });
            return;
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
        dispatch(addToast({ type: 'error', error: response.payload.error }));
    }

    return response;
};
