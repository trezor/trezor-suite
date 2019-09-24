import TrezorConnect from 'trezor-connect';
import Rollout from '@trezor/rollout';

import { lockUI } from '@suite-actions/suiteActions';

//  TODO: should be reworked to deviceManagementActions

// import * as notificationActions from '@suite-actions/notificationActions';
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

export type FirmwareUpdateActionTypes = SetUpdateStatusAction | ResetReducer | EnableReducer;

export const firmwareUpdate = () => async (dispatch: Dispatch, getState: GetState) => {
    const { device, locks } = getState().suite;
    if (!device || !device.connected || !device.features) {
        // todo: possibly dispatch error?
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
        // todo dispatch error notification
        return;
    }

    dispatch({ type: FIRMWARE.SET_UPDATE_STATUS, payload: 'installing' });

    const payload = {
        payload: fw,
        keepSession: false,
        skipFinalReload: true,
        device,
        length: fw.byteLength, // todo: this should be inferred by connect auto magically probably
    };
    const updateResponse = await TrezorConnect.firmwareUpdate(payload);
    if (!updateResponse.success) {
        // todo dispatch error notification
        dispatch({ type: FIRMWARE.SET_UPDATE_STATUS, payload: 'error' });
        // todo: what about notification? probably not needed
        // dispatch(
        //     notificationActions.add({
        //         variant: 'error',
        //         title: 'Firmware installation failed.',
        //         tags: [NOTIFICATION.TAG.FIRMWARE],
        //     }),
        // );

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
