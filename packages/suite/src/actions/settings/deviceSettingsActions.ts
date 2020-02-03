import TrezorConnect, { ApplySettingsParams, ChangePinParams } from 'trezor-connect';
import { add as addNotification } from '@suite-actions/notificationActions';

import { Dispatch, GetState } from '@suite-types';

//  TODO: should be reworked to deviceManagementActions

export const applySettings = (params: ApplySettingsParams) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { device } = getState().suite;
    const result = await TrezorConnect.applySettings({
        device,
        ...params,
    });

    if (result.success) {
        dispatch(addNotification({ type: 'settings-applied' }));
    } else {
        dispatch(addNotification({ type: 'error', error: result.payload.error }));
    }
};

export const changePin = (params: ChangePinParams) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { device } = getState().suite;
    const result = await TrezorConnect.changePin({
        device,
        ...params,
    });

    if (result.success) {
        dispatch(addNotification({ type: 'pin-changed' }));
    } else {
        dispatch(addNotification({ type: 'error', error: result.payload.error }));
    }
};

export const wipeDevice = () => async (dispatch: Dispatch, getState: GetState) => {
    const { device } = getState().suite;
    const result = await TrezorConnect.wipeDevice({
        device,
    });

    if (result.success) {
        dispatch(addNotification({ type: 'device-wiped' }));
    } else {
        dispatch(addNotification({ type: 'error', error: result.payload.error }));
    }

    // todo: evaluate in future, see https://github.com/trezor/trezor-suite/issues/1064
    // if (result.success && device && device.features) {
    //     dispatch({
    //         type: SUITE.REQUEST_DISCONNECT_DEVICE,
    //         payload: device,
    //     });
    // }
};
