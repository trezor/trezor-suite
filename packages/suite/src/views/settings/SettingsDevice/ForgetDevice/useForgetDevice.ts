import { events } from '@suite/analytics';
import { notificationsActions } from '@suite-common/toast-notifications';

import { suiteForgetDeviceThunk } from 'src/actions/suite/suiteForgetDeviceThunk';
import { useDispatch } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

/**
 * Hook that wraps `forgetDeviceThunk` with toast and analytics.
 * Accepts an optional `deviceId` param for cases where the selected device
 * is no longer available (e.g. after disconnect).
 */
export const useForgetDevice = () => {
    const dispatch = useDispatch();
    const analytics = useAnalytics();

    const forgetDevice = async ({
        skipToggleModalConnection,
        isOsUnpairingFinished,
        skipDisconnect,
        deviceId,
        toastType = 'device-forgotten',
    }: {
        skipToggleModalConnection?: boolean;
        isOsUnpairingFinished?: boolean;
        skipDisconnect?: boolean;
        deviceId?: string;
        toastType?: 'device-forgotten' | null;
    } = {}) => {
        await dispatch(
            suiteForgetDeviceThunk({
                skipToggleModalConnection: Boolean(skipToggleModalConnection),
                isOsUnpairingFinished: Boolean(isOsUnpairingFinished),
                skipDisconnect: Boolean(skipDisconnect),
                deviceId,
            }),
        );

        if (toastType) {
            dispatch(notificationsActions.addToast({ type: toastType }));
        }
        analytics.report({ type: events.switchDeviceForgetEvent.name });
    };

    return { forgetDevice, dispatch };
};
