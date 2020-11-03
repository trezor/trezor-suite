import TrezorConnect, { CommonParams } from 'trezor-connect';
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
export type BackupAction =
    | { type: typeof BACKUP.RESET_REDUCER }
    | { type: typeof BACKUP.TOGGLE_CHECKBOX_BY_KEY; payload: ConfirmKey }
    | { type: typeof BACKUP.SET_STATUS; payload: BackupStatus }
    | { type: typeof BACKUP.SET_ERROR; payload: string };

export const toggleCheckboxByKey = (key: ConfirmKey): BackupAction => ({
    type: BACKUP.TOGGLE_CHECKBOX_BY_KEY,
    payload: key,
});

export const setStatus = (status: BackupStatus): BackupAction => ({
    type: BACKUP.SET_STATUS,
    payload: status,
});

export const setError = (error: string): BackupAction => ({
    type: BACKUP.SET_ERROR,
    payload: error,
});

export const resetReducer = (): BackupAction => ({
    type: BACKUP.RESET_REDUCER,
});

export const backupDevice = (params: CommonParams = {}) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { device } = getState().suite;
    if (!device) {
        return dispatch(
            notificationActions.addToast({
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
        dispatch(notificationActions.addToast({ type: 'backup-failed' }));
        dispatch({
            type: BACKUP.SET_ERROR,
            payload: result.payload.error,
        });
    } else {
        dispatch(notificationActions.addToast({ type: 'backup-success' }));
    }
    dispatch({
        type: BACKUP.SET_STATUS,
        payload: 'finished',
    });
};
