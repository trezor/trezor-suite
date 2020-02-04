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
export type BackupActions = { type: typeof BACKUP.TOGGLE_CHECKBOX_BY_KEY; payload: ConfirmKey };

export const toggleCheckboxByKey = (key: ConfirmKey) => (dispatch: Dispatch) => {
    dispatch({
        type: BACKUP.TOGGLE_CHECKBOX_BY_KEY,
        payload: key,
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
    const result = await TrezorConnect.backupDevice({ ...params, device });
    if (result.success) {
        return dispatch(notificationActions.add({ type: 'backup-success' }));
    }
    dispatch(notificationActions.add({ type: 'backup-failed' }));
};
