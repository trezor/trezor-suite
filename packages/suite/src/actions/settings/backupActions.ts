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
