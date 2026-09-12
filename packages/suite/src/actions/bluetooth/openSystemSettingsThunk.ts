import { BLUETOOTH_PREFIX } from '@suite-common/bluetooth';
import { type WithServices, createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type DesktopApi, type DesktopApiDep, type InvokeResult } from '@trezor/suite-desktop-api';

type OpenSystemSettingsThunkParams = {
    type: Parameters<DesktopApi['openSystemSettings']>[0];
};

type OpenSystemSettingsThunkDeps = WithServices<DesktopApiDep<'openSystemSettings'>>;

export const openSystemSettingsThunk = createThunk<
    InvokeResult,
    OpenSystemSettingsThunkParams,
    { extra: OpenSystemSettingsThunkDeps }
>(
    `${BLUETOOTH_PREFIX}/openSystemSettingsThunk`,
    async ({ type }, { dispatch, fulfillWithValue, extra }) => {
        const result = await extra.services.desktopApi.openSystemSettings(type);

        if (!result.success) {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: result.error,
                }),
            );
        }

        return fulfillWithValue(result);
    },
);
