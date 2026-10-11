import { events, injectDesktopAnalytics } from '@suite/analytics';
import { notificationsActions } from '@suite-common/toast-notifications';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { suiteForgetDeviceThunk } from 'src/actions/suite/suiteForgetDeviceThunk';

/**
 * Hook that wraps `forgetDeviceThunk` with toast and analytics.
 * Accepts an optional `deviceId` param for cases where the selected device
 * is no longer available (e.g. after disconnect).
 */
export const useForgetDevice = () => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);

    type ForgetDeviceParams = {
        skipToggleModalConnection?: boolean;
        isOsUnpairingFinished?: boolean;
        skipDisconnect?: boolean;
        deviceId?: string;
        toastType?: 'device-forgotten' | null;
    };

    const forgetDevice = async ({
        skipToggleModalConnection,
        isOsUnpairingFinished,
        skipDisconnect,
        deviceId,
        toastType = 'device-forgotten',
    }: ForgetDeviceParams = {}) => {
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
