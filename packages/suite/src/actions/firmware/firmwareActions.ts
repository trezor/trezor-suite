import TrezorConnect from 'trezor-connect';
import { FIRMWARE } from '@firmware-actions/constants';
import { AnyStatus } from '@firmware-reducers/firmwareReducer';
import { Dispatch, GetState, Action, AcquiredDevice } from '@suite-types';

export type FirmwareActions =
    | { type: typeof FIRMWARE.SET_UPDATE_STATUS; payload: AnyStatus }
    | { type: typeof FIRMWARE.SET_TARGET_RELEASE; payload: AcquiredDevice['firmwareRelease'] }
    | { type: typeof FIRMWARE.RESET_REDUCER }
    | { type: typeof FIRMWARE.ENABLE_REDUCER; payload: boolean }
    | { type: typeof FIRMWARE.SET_ERROR; payload: string | undefined }
    | { type: typeof FIRMWARE.TOGGLE_BTC_ONLY };

export const resetReducer = () => (dispatch: Dispatch) => {
    dispatch({
        type: FIRMWARE.RESET_REDUCER,
    });
};

export const setStatus = (payload: AnyStatus): Action => ({
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

export const toggleBtcOnly = (): Action => ({
    type: FIRMWARE.TOGGLE_BTC_ONLY,
});

export const firmwareUpdate = () => async (dispatch: Dispatch, getState: GetState) => {
    const { device } = getState().suite;
    const { btcOnly, targetRelease } = getState().firmware;

    dispatch(resetReducer());
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

    dispatch(setStatus('downloading'));

    const payload = {
        keepSession: false,
        skipFinalReload: true,
        device: {
            path: device.path,
        },
        btcOnly,
        version: targetRelease?.release?.version || device.firmwareRelease?.release?.version,
    };

    dispatch(setStatus('started'));

    const updateResponse = await TrezorConnect.firmwareUpdate(payload);

    if (!updateResponse.success) {
        return dispatch({ type: FIRMWARE.SET_ERROR, payload: updateResponse.payload.error });
    }

    dispatch(setStatus(model === 1 ? 'unplug' : 'wait-for-reboot'));
};
