import { BLUETOOTH_PREFIX } from '@suite-common/bluetooth';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type InvokeResult, desktopApi } from '@trezor/suite-desktop-api';

type OpenSystemSettingsThunkParams = {
    type: Parameters<typeof desktopApi.openSystemSettings>[0];
};

export const openSystemSettingsThunk = createThunk<
    InvokeResult,
    OpenSystemSettingsThunkParams,
    void
>(
    `${BLUETOOTH_PREFIX}/openSystemSettingsThunk`,
    async ({ type }, { dispatch, fulfillWithValue }) => {
        const result = await desktopApi.openSystemSettings(type);

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
