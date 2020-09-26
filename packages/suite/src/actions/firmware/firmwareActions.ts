import TrezorConnect from 'trezor-connect';
import { FIRMWARE } from '@firmware-actions/constants';
import { Dispatch, GetState, AppState, Action, AcquiredDevice } from '@suite-types';
import * as analyticsActions from '@suite-actions/analyticsActions';
import { isBitcoinOnly } from '@suite-utils/device';

export type FirmwareActions =
    | {
          type: typeof FIRMWARE.SET_UPDATE_STATUS;
          payload: ReturnType<GetState>['firmware']['status'];
      }
    | { type: typeof FIRMWARE.SET_TARGET_RELEASE; payload: AcquiredDevice['firmwareRelease'] }
    | { type: typeof FIRMWARE.RESET_REDUCER }
    | { type: typeof FIRMWARE.ENABLE_REDUCER; payload: boolean }
    | { type: typeof FIRMWARE.SET_ERROR; payload: string }
    | { type: typeof FIRMWARE.TOGGLE_HAS_SEED };

export const resetReducer = () => (dispatch: Dispatch) => {
    dispatch({
        type: FIRMWARE.RESET_REDUCER,
    });
};

export const setStatus = (payload: AppState['firmware']['status']): Action => ({
    type: FIRMWARE.SET_UPDATE_STATUS,
    payload,
});

export const setTargetRelease = (payload: AcquiredDevice['firmwareRelease']) => (
    dispatch: Dispatch,
) => {
    dispatch({
        type: FIRMWARE.SET_TARGET_RELEASE,
        payload,
    });
};

export const firmwareUpdate = () => async (dispatch: Dispatch, getState: GetState) => {
    const { device } = getState().suite;
    const { targetRelease } = getState().firmware;

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

    const model = device.features.major_version;

    // for update (in firmware modal) target release is set. otherwise use device.firmwareRelease
    const toFwVersion = targetRelease?.release?.version || device.firmwareRelease.release.version;
    const fromBlVersion = [
        device.features.major_version,
        device.features.minor_version,
        device.features.patch_version,
    ].join();

    dispatch(setStatus('downloading'));

    // update to same variant as is currently installed
    const toBtcOnly = isBitcoinOnly(device);

    const payload = {
        keepSession: false,
        skipFinalReload: true,
        device: {
            path: device.path,
        },
        btcOnly: toBtcOnly,
        version: toFwVersion,
    };

    dispatch(setStatus('started'));

    const updateResponse = await TrezorConnect.firmwareUpdate(payload);

    // some basic firmware update reporting, not great, not terrible but definitely not complete
    // we would like to know from which version to which version user updates. the trouble is, that
    // this is not possible to do with 100% accuracy, why:
    // - user may connect device A in bootloader, get target firmware for device A, reconnect in normal mode device B and install fw.
    // - connect device directly into bootloader (actually suite does not allow this, but onboarding does as new devices without fw are in bootloader,
    // todo: I could rework it into middleware, log multiple actions as user goes through fw update process
    // -- are we okay that results will not be 100% accurate [product]
    // -- are we okay that data will need to do some more work with data connecting?
    // -- (ofc I may store logging data in our data model and send it at once, hmm maybe?)
    dispatch(
        analyticsActions.report({
            type: 'device-update-firmware',
            payload: {
                // todo: fromFwVersion
                // todo: fromBtcOnly,
                fromBlVersion,
                toFwVersion,
                toBtcOnly,
                error: !updateResponse.success ? updateResponse.payload.error : '',
            },
        }),
    );

    if (!updateResponse.success) {
        return dispatch({ type: FIRMWARE.SET_ERROR, payload: updateResponse.payload.error });
    }

    dispatch(setStatus(model === 1 ? 'unplug' : 'wait-for-reboot'));
};

export const toggleHasSeed = (): Action => ({
    type: FIRMWARE.TOGGLE_HAS_SEED,
});
