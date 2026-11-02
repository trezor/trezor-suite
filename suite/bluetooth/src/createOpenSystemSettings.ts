import { type Dispatch } from '@reduxjs/toolkit';

import { type DesktopApi, type DesktopApiDep } from '@suite/desktop-app-api';
import { notificationsActions } from '@suite-common/toast-notifications';

type OpenSystemSettingsDeps = DesktopApiDep<'openSystemSettings'> & {
    dispatch: Dispatch;
};

export type OpenSystemSettings = (
    type: 'bluetooth' | 'bluetooth-permissions',
) => ReturnType<DesktopApi['openSystemSettings']>;

export const createOpenSystemSettings =
    (deps: OpenSystemSettingsDeps): OpenSystemSettings =>
    async type => {
        const result = await deps.desktopApi.openSystemSettings(type).catch(error => ({
            success: false as const,
            error: error.message,
        }));

        if (!result.success) {
            deps.dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: result.error,
                }),
            );
        }

        return result;
    };
