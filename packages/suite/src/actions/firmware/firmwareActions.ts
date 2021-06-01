import TrezorConnect, { Device } from 'trezor-connect';

import { FIRMWARE } from '@firmware-actions/constants';
import * as analyticsActions from '@suite-actions/analyticsActions';
import { getFwVersion, isBitcoinOnly } from '@suite-utils/device';

import type { Dispatch, GetState, AppState, AcquiredDevice } from '@suite-types';

export type FirmwareAction =
    | {
          type: typeof FIRMWARE.SET_UPDATE_STATUS;
          payload: ReturnType<GetState>['firmware']['status'];
      }
    | { type: typeof FIRMWARE.SET_TARGET_RELEASE; payload: AcquiredDevice['firmwareRelease'] }
    | { type: typeof FIRMWARE.RESET_REDUCER }
    | { type: typeof FIRMWARE.ENABLE_REDUCER; payload: boolean }
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

export const firmwareUpdate = () => async (dispatch: Dispatch, getState: GetState) => {
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

    let fromFwVersion = 'none';
    if (prevDevice && prevDevice.features && prevDevice.firmware !== 'none') {
        fromFwVersion = getFwVersion(prevDevice);
    }

    // for update (in firmware modal) target release is set. otherwise use device.firmwareRelease
    const toFwVersion = targetRelease?.release?.version || device.firmwareRelease!.release.version;

    // device in bootloader mode have bootloader version in attributes used for fw version in non-bootloader mode
    const fromBlVersion = getFwVersion(device);

    // update to same variant as is currently installed or to the regular one if device does not have any fw (new/wiped device)
    const isBtcOnlyFirmware = !prevDevice ? false : isBitcoinOnly(prevDevice);

    const payload = {
        keepSession: false,
        skipFinalReload: true,
        device: {
            path: device.path,
        },
        btcOnly: isBtcOnlyFirmware,
        version: toFwVersion,
    };

    const updateResponse = await TrezorConnect.firmwareUpdate(payload);

    dispatch(
        analyticsActions.report({
            type: 'device-update-firmware',
            payload: {
                fromFwVersion,
                fromBlVersion,
                toFwVersion: toFwVersion.join('.'),
                toBtcOnly: isBtcOnlyFirmware,
                error: !updateResponse.success ? updateResponse.payload.error : '',
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

export const toggleHasSeed = (): FirmwareAction => ({
    type: FIRMWARE.TOGGLE_HAS_SEED,
});

export const rememberPreviousDevice = (device: Device) => ({
    type: FIRMWARE.REMEMBER_PREVIOUS_DEVICE,
    payload: device,
});
