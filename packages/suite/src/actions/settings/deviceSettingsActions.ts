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

    dispatch(
        addNotification({
            variant: result.success ? 'success' : 'error',
            title: result.success ? result.payload.message : result.payload.error,
            cancelable: true,
        }),
    );
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

    dispatch(
        addNotification({
            variant: result.success ? 'success' : 'error',
            title: result.success ? result.payload.message : result.payload.error,
            cancelable: true,
        }),
    );
};

export const wipeDevice = () => async (dispatch: Dispatch, getState: GetState) => {
    const { device } = getState().suite;
    const result = await TrezorConnect.wipeDevice({
        device,
    });

    dispatch(
        addNotification({
            variant: result.success ? 'success' : 'error',
            title: result.success ? result.payload.message : result.payload.error,
            cancelable: true,
        }),
    );

    // todo: evaluate in future, see https://github.com/trezor/trezor-suite/issues/1064
    // if (result.success && device && device.features) {
    //     dispatch({
    //         type: SUITE.REQUEST_DISCONNECT_DEVICE,
    //         payload: device,
    //     });
    // }
};
