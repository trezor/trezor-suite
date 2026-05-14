import { asTypedDesktopAnalytics, events } from '@suite/analytics';
import { selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import TrezorConnect from '@trezor/connect';

import { backupActions } from './backupReducer';
import type { BackupDeviceParams } from './types';

const actionPrefix = '@suite/backup';

export const backupDeviceThunk = createThunk(
    `${actionPrefix}/backupDeviceThunk`,
    async (
        {
            params = {},
            skipSuccessToast,
        }: {
            params?: BackupDeviceParams;
            skipSuccessToast?: boolean;
        },
        { dispatch, getState, extra },
    ) => {
        const device = selectSelectedDevice(getState());
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
            asTypedDesktopAnalytics(extra.services.analytics).report({
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
            asTypedDesktopAnalytics(extra.services.analytics).report({
                type: events.createBackupEvent.name,
                payload: {
                    status: 'finished',
                    error: '',
                },
            });
        }
    },
);
