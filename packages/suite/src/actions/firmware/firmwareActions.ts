import TrezorConnect from 'trezor-connect';
import { FIRMWARE } from '@firmware-actions/constants';
import { Dispatch, GetState, AppState, AcquiredDevice } from '@suite-types';
import * as analyticsActions from '@suite-actions/analyticsActions';
import { isBitcoinOnly } from '@suite-utils/device';

export type FirmwareAction =
    | {
          type: typeof FIRMWARE.SET_UPDATE_STATUS;
          payload: ReturnType<GetState>['firmware']['status'];
      }
    | { type: typeof FIRMWARE.SET_TARGET_RELEASE; payload: AcquiredDevice['firmwareRelease'] }
    | { type: typeof FIRMWARE.RESET_REDUCER }
    | { type: typeof FIRMWARE.ENABLE_REDUCER; payload: boolean }
    | { type: typeof FIRMWARE.SET_ERROR; payload?: string }
    | { type: typeof FIRMWARE.TOGGLE_HAS_SEED };

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

    // for update (in firmware modal) target release is set. otherwise use device.firmwareRelease
    const toRelease = targetRelease || device.firmwareRelease;

    if (!toRelease) return;

    const fromBlVersion = [
        device.features.major_version,
        device.features.minor_version,
        device.features.patch_version,
    ].join();

    let fromFwVersion = 'none';

    if (prevDevice?.features && prevDevice?.firmware !== 'none') {
        fromFwVersion = [
            prevDevice.features.major_version,
            prevDevice.features.minor_version,
            prevDevice.features.patch_version,
        ].join();
    }

    // update to same variant as is currently installed
    const toBtcOnly = isBitcoinOnly(device);

    const payload = {
        keepSession: false,
        skipFinalReload: true,
        device: {
            path: device.path,
        },
        btcOnly: toBtcOnly,
        version: toRelease.release.version,
        // if we detect latest firmware may not be used right away, we should use intermediary instead
        intermediary: !toRelease.isLatest,
    };

    const updateResponse = await TrezorConnect.firmwareUpdate(payload);

    console.warn('updateResponse', updateResponse);

    dispatch(
        analyticsActions.report({
            type: 'device-update-firmware',
            payload: {
                fromFwVersion,
                fromBlVersion,
                toFwVersion: toRelease.release.version.join('.'),
                toBtcOnly,
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
    // ask user to unplug device (see firmwareMiddleware)
    // model 2 without pin
    // ask user to wait until device reboots
    dispatch(setStatus(model === 1 ? 'unplug' : 'wait-for-reboot'));
};

export const toggleHasSeed = (): FirmwareAction => ({
    type: FIRMWARE.TOGGLE_HAS_SEED,
});
