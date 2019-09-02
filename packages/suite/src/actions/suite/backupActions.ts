import TrezorConnect, { BackupDeviceParams } from 'trezor-connect';
import * as notificationActions from '@suite-actions/notificationActions';
import { Dispatch } from '@suite-types';
//  TODO: should be reworked to deviceManagementActions

export const backupDevice = (params: BackupDeviceParams) => async (dispatch: Dispatch) => {
    const result = await TrezorConnect.backupDevice(params);
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
