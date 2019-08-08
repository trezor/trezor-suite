import Rollout from '@trezor/rollout';
import * as FIRMWARE_UPDATE from '@onboarding-types/firmwareUpdate';
import { DEVICE_CALL_RESET } from '@onboarding-types/connect';

import * as STATUS from '@onboarding-actions/constants/firmwareUpdateStatus';

import { firmwareUpdate } from './connectActions';
import { Dispatch, GetState } from '@suite-types';

const updateFirmware = () => async (dispatch: Dispatch, getState: GetState) => {
    dispatch({ type: DEVICE_CALL_RESET });
    dispatch({ type: FIRMWARE_UPDATE.SET_ERROR, value: null });
    dispatch({ type: FIRMWARE_UPDATE.SET_UPDATE_STATUS, value: STATUS.STARTED });

    const { device } = getState().onboarding.connect;
    if (!device || !device.connected) {
        throw new Error('device is not connected');
    }

    dispatch({ type: FIRMWARE_UPDATE.SET_UPDATE_STATUS, value: STATUS.DOWNLOADING });

    const rollout = Rollout({
        releasesListsPaths: {
            1: 'data/firmware/1/releases.json',
            2: 'data/firmware/2/releases.json',
        },
        baseUrl: 'https://wallet.trezor.io',
    });

    try {
        dispatch({ type: FIRMWARE_UPDATE.SET_FIRMWARE, value: null });
        const response = await rollout.getFw(getState().onboarding.connect.device.features);
        if (!response) {
            throw new Error('no firmware found');
        }
        dispatch({
            type: FIRMWARE_UPDATE.SET_FIRMWARE,
            value: response,
        });
    } catch (error) {
        dispatch({ type: FIRMWARE_UPDATE.SET_ERROR, value: error.message });
    }

    dispatch({ type: FIRMWARE_UPDATE.SET_UPDATE_STATUS, value: STATUS.INSTALLING });

    // ignoring type invalidation...
    const fw = getState().onboarding.firmwareUpdate.firmware as ArrayBuffer;

    // todo: when types in connect ready
    const payload: any = {
        payload: fw,
        keepSession: false,
        skipFinalReload: true,
    };

    await dispatch(firmwareUpdate(payload));
    dispatch({ type: FIRMWARE_UPDATE.SET_UPDATE_STATUS, value: STATUS.DONE });
};

export { updateFirmware };
