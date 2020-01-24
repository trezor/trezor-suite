import TrezorConnect from 'trezor-connect';
import Rollout from '@trezor/rollout';

import { lockUI } from '@suite-actions/suiteActions';
import { FIRMWARE } from '@firmware-actions/constants';
import { AnyStatus } from '@firmware-reducers/firmwareReducer';
import { Dispatch, GetState, Action } from '@suite-types';

export type FirmwareActions =
    | { type: typeof FIRMWARE.SET_UPDATE_STATUS; payload: AnyStatus }
    | { type: typeof FIRMWARE.RESET_REDUCER }
    | { type: typeof FIRMWARE.ENABLE_REDUCER; payload: boolean }
    | { type: typeof FIRMWARE.SET_ERROR; payload: string | undefined }
    | { type: typeof FIRMWARE.CONFIRM_SEED; payload: boolean };

export const resetReducer = () => (dispatch: Dispatch) => {
    dispatch({
        type: FIRMWARE.RESET_REDUCER,
    });
};

export const setStatus = (payload: AnyStatus): Action => ({
    type: FIRMWARE.SET_UPDATE_STATUS,
    payload,
});

export const confirmSeed = (payload: boolean): Action => ({
    type: FIRMWARE.CONFIRM_SEED,
    payload,
});

export const firmwareUpdate = () => async (dispatch: Dispatch, getState: GetState) => {
    const { device } = getState().suite;

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

    dispatch(lockUI(true));

    dispatch(setStatus('downloading'));

    const rollout = Rollout({
        releasesListsPaths: {
            1: 'data/firmware/1/releases.json',
            2: 'data/firmware/2/releases.json',
        },
        baseUrl: 'https://wallet.trezor.io',
    });

    let fw;
    try {
        fw = await rollout.getFw(device.features);
        if (!fw) {
            throw new Error('no firmware found');
        }
    } catch (error) {
        dispatch({ type: FIRMWARE.SET_ERROR, payload: 'failed to download firmware' });
        return;
    }
    const payload = {
        payload: fw,
        keepSession: false,
        skipFinalReload: true,
        device,
    };

    dispatch(setStatus('started'));

    const updateResponse = await TrezorConnect.firmwareUpdate(payload);

    if (!updateResponse.success) {
        dispatch({ type: FIRMWARE.SET_ERROR, payload: updateResponse.payload.error });

        return dispatch(lockUI(false));
    }

    dispatch(setStatus(model === 1 ? 'unplug' : 'wait-for-reboot'));
};
