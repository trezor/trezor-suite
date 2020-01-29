import TrezorConnect, { BackupDeviceParams } from 'trezor-connect';
import * as notificationActions from '@suite-actions/notificationActions';
import { Dispatch, GetState } from '@suite-types';

export const backupDevice = (params: BackupDeviceParams = {}) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { device } = getState().suite;
    if (!device) {
        return dispatch(
            notificationActions.add({
                variant: 'error',
                title: 'no device connected',
                cancelable: true,
            }),
        );
    }
    const result = await TrezorConnect.backupDevice({ ...params, device });
    if (result.success) {
        return dispatch(
            notificationActions.add({
                variant: 'success',
                title: 'backup successful',
                cancelable: true,
            }),
        );
    }
    dispatch(
        notificationActions.add({
            variant: 'error',
            title: 'backup failed',
            cancelable: true,
        }),
    );
};
