import type { PromiseType } from 'react-use/lib/util';

import TrezorConnect, { Device } from 'trezor-connect';

import { FIRMWARE } from '@firmware-actions/constants';
import { report, AnalyticsEvent } from '@suite-actions/analyticsActions';
import { getFwVersion, isBitcoinOnly } from '@suite-utils/device';

import type { Dispatch, GetState, AppState, AcquiredDevice } from '@suite-types';
import { addToast } from '@suite-actions/notificationActions';

export type FirmwareAction =
    | {
          type: typeof FIRMWARE.SET_UPDATE_STATUS;
          payload: ReturnType<GetState>['firmware']['status'];
      }
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
const firmwareInstall = (fwBinary?: ArrayBuffer) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
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

    // device in bootloader mode have bootloader version in attributes used for fw version in non-bootloader mode
    const fromBlVersion = getFwVersion(device);

    let updateResponse: PromiseType<ReturnType<typeof TrezorConnect.firmwareUpdate>>;
    let analyticsPayload: Partial<
        Extract<AnalyticsEvent, { type: 'device-update-firmware' }>['payload']
    >;

    if (fwBinary) {
        console.warn(`Installing custom firmware`);

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

        const intermediary = !toRelease.isLatest;
        if (intermediary) {
            console.warn('Cannot install latest firmware. Will install intermediary fw instead.');
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
            btcOnly: isBtcOnlyFirmware,
            version: toRelease.release.version,
            // if we detect latest firmware may not be used right away, we should use intermediary instead
            intermediary,
        });

        if (updateResponse.success && intermediary) {
            dispatch({ type: FIRMWARE.SET_INTERMEDIARY_INSTALLED, payload: true });
        }
    }

    dispatch(
        report({
            type: 'device-update-firmware',
            payload: {
                fromFwVersion,
                fromBlVersion,
                error: !updateResponse.success ? updateResponse.payload.error : '',
                ...analyticsPayload,
            },
        }),
    );

    if (!updateResponse.success) {
        return dispatch({ type: FIRMWARE.SET_ERROR, payload: updateResponse.payload.error });
    }

    // handling case described here: https://github.com/trezor/trezor-suite/issues/2650
    // firmwareMiddleware handles device-connect event but it never happens for model T
    // with pin_protection set to true. In this case, we show success screen directly.
    if (prevDevice?.features?.pin_protection && prevDevice?.features?.major_version === 2) {
        return dispatch(setStatus('done'));
    }

    // model 1
    // ask user to unplug device if BL < 1.10.0 (see firmwareMiddleware), BL starting with 1.10.0 will automatically restart itself just like on model T
    // model 2 without pin
    // ask user to wait until device reboots
    dispatch(
        setStatus(model === 1 && device.features.minor_version < 10 ? 'unplug' : 'wait-for-reboot'),
    );
};

export const firmwareUpdate = () => firmwareInstall();

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
