import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { type DeviceRootState } from '@suite-common/device';
import { type WithServices, createThunk } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import TrezorConnect from '@trezor/connect';

import { actionPrefix, backupActions } from './backupReducer';
import type { BackupDeviceParams } from './types';

type BackupDeviceThunkParams = {
    /**
     * The device to back up. Named by the caller rather than read from the global selection: the
     * device disconnects and reconnects during onboarding, and the selection moves while it is
     * away.
     */
    device: TrezorDevice | undefined;
    params?: BackupDeviceParams;
    skipSuccessToast?: boolean;
};

export type BackupDeviceThunkState = DeviceRootState;

export type BackupDeviceThunkDeps = WithServices<DesktopAnalyticsDep>;

export const backupDeviceThunk = createThunk<
    void,
    BackupDeviceThunkParams,
    { state: BackupDeviceThunkState; extra: BackupDeviceThunkDeps }
>(
    `${actionPrefix}/backupDeviceThunk`,
    async ({ device, params = {}, skipSuccessToast }, { dispatch, extra }) => {
        if (!device) {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: 'Device not connected',
                }),
            );

            return;
        }

        dispatch(backupActions.setInProgress(true));

        const result = await TrezorConnect.backupDevice({
            ...params,
            device: {
                path: device.path,
            },
        });
        if (!result.success) {
            // When backupDevice fails (e.g. user cancels it) features are not updated in connect so we need to update at suite level
            // in order for suite to know it, and do not allow user to recovery again and fail.
            await TrezorConnect.getFeatures({ device: { path: device.path } });

            dispatch(notificationsActions.addToast({ type: 'backup-failed' }));
            dispatch(backupActions.setError(result.error.message));
            extra.services.analytics.report({
                type: events.createBackupEvent.name,
                payload: {
                    status: 'error',
                    error: result.error.message,
                },
            });
        } else {
            if (!skipSuccessToast) {
                dispatch(notificationsActions.addToast({ type: 'backup-success' }));
            }
            dispatch(backupActions.setInProgress(false));
            extra.services.analytics.report({
                type: events.createBackupEvent.name,
                payload: {
                    status: 'finished',
                    error: '',
                },
            });
        }
    },
);
