import TrezorConnect from 'trezor-connect';
import Rollout from '@trezor/rollout';

import { lockUI } from '@suite-actions/suiteActions';

//  TODO: should be reworked to deviceManagementActions

import { SUITE, FIRMWARE } from '@suite-actions/constants';
import { AnyStatus } from '@suite-reducers/firmwareReducer';
import { Dispatch, GetState, Action } from '@suite-types';

export type FirmwareUpdateActionTypes =
    | { type: typeof FIRMWARE.SET_UPDATE_STATUS; payload: AnyStatus }
    | { type: typeof FIRMWARE.RESET_REDUCER }
    | { type: typeof FIRMWARE.ENABLE_REDUCER; payload: boolean }
    | { type: typeof FIRMWARE.SET_ERROR; payload: string | undefined }
    | { type: typeof FIRMWARE.CONFIRM_SEED };

export const firmwareUpdate = () => async (dispatch: Dispatch, getState: GetState) => {
    const { device, locks } = getState().suite;
    const { devices } = getState();

    dispatch({ type: FIRMWARE.RESET_REDUCER });

    if (!device || !device.connected || !device.features) {
        dispatch({ type: FIRMWARE.SET_ERROR, payload: 'no device connected' });
        return;
    }

    // todo: limit only to real devices, exclude virtual.
    if (devices.length > 1) {
        dispatch({
            type: FIRMWARE.SET_ERROR,
            payload: 'you should have only one device connected during firmware update',
        });
    }

    if (device.mode !== 'bootloader') {
        dispatch({
            type: FIRMWARE.SET_ERROR,
            payload: 'device must be connected in bootloader mode',
        });
        return;
    }

    const model = device.features.major_version;

    if (!locks.includes(SUITE.LOCK_TYPE.UI)) {
        dispatch(lockUI(true));
    }

    dispatch({ type: FIRMWARE.SET_UPDATE_STATUS, payload: 'downloading' });

    const rollout = Rollout({
        releasesListsPaths: {
            1: 'data/firmware/1/releases.json',
            2: 'data/firmware/2/releases.json',
        },
        baseUrl: 'https://beta-wallet.trezor.io',
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

    dispatch({ type: FIRMWARE.SET_UPDATE_STATUS, payload: 'started' });

    const updateResponse = await TrezorConnect.firmwareUpdate(payload);

    if (!updateResponse.success) {
        dispatch({ type: FIRMWARE.SET_ERROR, payload: updateResponse.payload.error });

        return dispatch(lockUI(false));
    }

    dispatch({
        type: FIRMWARE.SET_UPDATE_STATUS,
        payload: model === 1 ? 'unplug' : 'wait-for-reboot',
    });

    // dispatch(lockUI(false));
};

export const resetReducer = () => (dispatch: Dispatch) => {
    dispatch({
        type: FIRMWARE.RESET_REDUCER,
    });
};

export const enableReducer = (payload: boolean): Action => ({
    type: FIRMWARE.ENABLE_REDUCER,
    payload,
});

export const setStatus = (payload: AnyStatus): Action => ({
    type: FIRMWARE.SET_UPDATE_STATUS,
    payload,
});

export const confirmSeed = (): Action => ({
    type: FIRMWARE.CONFIRM_SEED,
});

export const init = (): Action => ({
    type: FIRMWARE.INIT,
});
