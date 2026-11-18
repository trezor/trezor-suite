import { useCallback } from 'react';

import { type DeviceSessionError, useDeviceReadyGuard } from '@suite/device';
import { notificationsActions } from '@suite-common/toast-notifications';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { getDeviceErrorMessage } from '#src/utils/wallet/getDeviceErrorMessage';

export const useDeviceReadyGuardWithToast = () => {
    const { dispatch } = useServices(injectDispatch);

    const onFailed = useCallback(
        (error: DeviceSessionError) => {
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: getDeviceErrorMessage(error) ?? error.message,
                }),
            );
        },
        [dispatch],
    );

    return useDeviceReadyGuard({ onFailed });
};
