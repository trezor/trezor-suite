import TrezorConnect from 'trezor-connect';
import Rollout from '@trezor/rollout';

import { lockUI } from '@suite-actions/suiteActions';

//  TODO: should be reworked to deviceManagementActions

import { SUITE, FIRMWARE } from '@suite-actions/constants';
import { AnyStatus } from '@suite-reducers/firmwareReducer';
import { Dispatch, GetState, Action } from '@suite-types';

interface SetUpdateStatusAction {
    type: typeof FIRMWARE.SET_UPDATE_STATUS;
    payload: AnyStatus;
}

interface ResetReducer {
    type: typeof FIRMWARE.RESET_REDUCER;
}
interface EnableReducer {
    type: typeof FIRMWARE.ENABLE_REDUCER;
    payload: boolean;
}

interface SetError {
    type: typeof FIRMWARE.SET_ERROR;
    payload: string | undefined;
}

export type FirmwareUpdateActionTypes =
    | SetUpdateStatusAction
    | ResetReducer
    | EnableReducer
    | SetError;

export const firmwareUpdate = () => async (dispatch: Dispatch, getState: GetState) => {
    const { device, locks } = getState().suite;
    dispatch({ type: FIRMWARE.SET_ERROR, payload: undefined });

    if (!device || !device.connected || !device.features) {
        dispatch({ type: FIRMWARE.SET_ERROR, payload: 'no device connected' });
        return;
    }

    if (!locks.includes(SUITE.LOCK_TYPE.UI)) {
        dispatch(lockUI(true));
    }

    dispatch({ type: FIRMWARE.SET_UPDATE_STATUS, payload: 'started' });
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

    const updateResponse = await TrezorConnect.firmwareUpdate(payload);

    if (!updateResponse.success) {
        dispatch({ type: FIRMWARE.SET_ERROR, payload: updateResponse.payload.error });

        return dispatch(lockUI(false));
    }

    dispatch({ type: FIRMWARE.SET_UPDATE_STATUS, payload: 'restarting' });

    dispatch(lockUI(false));
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
