import TrezorConnect, { BackupDeviceParams } from 'trezor-connect';
import * as notificationActions from '@suite-actions/notificationActions';
import { BACKUP } from '@backup-actions/constants';

import { Dispatch, GetState } from '@suite-types';

export type ConfirmKey =
    | 'has-enough-time'
    | 'is-in-private'
    | 'understands-what-seed-is'
    | 'wrote-seed-properly'
    | 'made-no-digital-copy'
    | 'will-hide-seed';

export type BackupStatus = 'initial' | 'in-progress' | 'finished';
export type BackupActions =
    | { type: typeof BACKUP.RESET_REDUCER }
    | { type: typeof BACKUP.TOGGLE_CHECKBOX_BY_KEY; payload: ConfirmKey }
    | { type: typeof BACKUP.SET_STATUS; payload: BackupStatus }
    | { type: typeof BACKUP.SET_ERROR; payload: string };

export const toggleCheckboxByKey = (key: ConfirmKey) => (dispatch: Dispatch) => {
    return dispatch({
        type: BACKUP.TOGGLE_CHECKBOX_BY_KEY,
        payload: key,
    });
};

export const setStatus = (status: BackupStatus) => (dispatch: Dispatch) => {
    return dispatch({
        type: BACKUP.SET_STATUS,
        payload: status,
    });
};

export const setError = (error: string) => (dispatch: Dispatch) => {
    return dispatch({
        type: BACKUP.SET_ERROR,
        payload: error,
    });
};

export const resetReducer = () => (dispatch: Dispatch) => {
    return dispatch({
        type: BACKUP.RESET_REDUCER,
    });
};

export const backupDevice = (params: BackupDeviceParams = {}) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { device } = getState().suite;
    if (!device) {
        return dispatch(
            notificationActions.add({
                type: 'error',
                error: 'Device not connected',
            }),
        );
    }

    dispatch({
        type: BACKUP.SET_STATUS,
        payload: 'in-progress',
    });

    const result = await TrezorConnect.backupDevice({
        ...params,
        device: {
            path: device.path,
        },
    });
    if (!result.success) {
        dispatch(notificationActions.add({ type: 'backup-failed' }));
        dispatch({
            type: BACKUP.SET_ERROR,
            payload: result.payload.error,
        });
    } else {
        dispatch(notificationActions.add({ type: 'backup-success' }));
    }
    dispatch({
        type: BACKUP.SET_STATUS,
        payload: 'finished',
    });
};
