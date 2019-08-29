import TrezorConnect, { BackupDeviceParams } from 'trezor-connect';
import { lockUI } from '@suite-actions/suiteActions';
import { Dispatch } from '@suite-types';

//  TODO: should be reworked to deviceManagementActions

export const backupDevice = (params: BackupDeviceParams) => async (dispatch: Dispatch) => {
    dispatch(lockUI(true));
    await TrezorConnect.backupDevice(params);
    dispatch(lockUI(false));
    // todo: dispatch result notification;
};
