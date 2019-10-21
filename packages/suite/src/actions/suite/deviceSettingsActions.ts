import TrezorConnect, { ApplySettingsParams, ChangePinParams, CommonParams } from 'trezor-connect';
import { add as addNotification } from '@suite-actions/notificationActions';
import { SUITE } from '@suite-actions/constants';
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

export const wipeDevice = (params: CommonParams) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { device } = getState().suite;
    const result = await TrezorConnect.wipeDevice({
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

    if (result.success && device && device.features) {
        dispatch({
            type: SUITE.REQUEST_DISCONNECT_DEVICE,
            payload: device,
        });
    }
};
