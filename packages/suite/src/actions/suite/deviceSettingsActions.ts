import TrezorConnect, { ApplySettingsParams, ChangePinParams } from 'trezor-connect';
import { add as addNotification } from '@suite-actions/notificationActions';
import { SUITE, DEVICE_SETTINGS } from '@suite-actions/constants';
import { Dispatch, GetState, AcquiredDevice } from '@suite-types';

//  TODO: should be reworked to deviceManagementActions

export type DeviceSettingsActions = {
    type: typeof DEVICE_SETTINGS.OPEN_BACKGROUND_GALLERY_MODAL;
    payload: AcquiredDevice;
};

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

    if (result.success && device && device.features) {
        dispatch({
            type: SUITE.REQUEST_DISCONNECT_DEVICE,
            payload: device,
        });
    }
};

export const openBackgroundGalleryModal = () => (dispatch: Dispatch, getState: GetState) => {
    const { device } = getState().suite;
    if (!device || !device.features) return;
    dispatch({
        type: DEVICE_SETTINGS.OPEN_BACKGROUND_GALLERY_MODAL,
        payload: device,
    });
};
