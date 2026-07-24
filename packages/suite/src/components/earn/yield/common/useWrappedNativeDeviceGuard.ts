import { useCallback } from 'react';

import { useDevice } from '@suite/device';
import { useTranslation } from '@suite/intl';
import { notificationsActions } from '@suite-common/toast-notifications';

import { setConnectionModal, setConnectionMode } from 'src/actions/device/deviceSlice';
import { useDispatch } from 'src/hooks/suite';

import { ensureDeviceSession } from '../hooks/ensureDeviceSession';

export const useWrappedNativeDeviceGuard = () => {
    const dispatch = useDispatch();
    const { device } = useDevice();
    const { translationString } = useTranslation();

    return useCallback(async () => {
        if (!device?.connected || !device.available) {
            if (device?.descriptor?.apiType === 'bluetooth') {
                dispatch(setConnectionMode('bluetooth'));
            }
            dispatch(setConnectionModal(true));

            return false;
        }

        const result = await ensureDeviceSession(device);

        if (result.success) {
            return true;
        }

        if (result.error) {
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: translationString(result.error),
                }),
            );
        }

        return false;
    }, [device, dispatch, translationString]);
};
