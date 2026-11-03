import { useSelector } from 'react-redux';

import {
    deviceActions,
    selectIsDeviceInitialized,
    selectSelectedDevice,
} from '@suite-common/device';
import { useNavigationRemoveActionInterceptor } from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useCloseDeviceCompromisedScreen } from './useCloseDeviceCompromisedScreen';

/**
 * Closes the Device Compromised screen after a FW check (FW authenticity, device id, invariability) failure
 * and dismisses the FW checks for the selected device.
 */
export const useCloseFirmwareChecksFailScreen = () => {
    const { dispatch } = useServices(injectDispatch);
    const device = useSelector(selectSelectedDevice);
    const isDeviceInitialized = useSelector(selectIsDeviceInitialized);
    const { handleClose: closeScreen } = useCloseDeviceCompromisedScreen();

    // Device id should always be present, but if not, fail-closed by not allowing to dismiss the failed check.
    // For an initialized device, the check must be dismissible for emergency access to wallet.
    const deviceId = device?.id;
    const isValidId = typeof deviceId === 'string' && deviceId.length > 0; // matches `getIsDeviceIdValid`
    const canClose = isValidId && isDeviceInitialized;

    // Always blocked – even when `canClose`, it can be done only by explicit CTAs, not by native navigation or automatic triggers.
    useNavigationRemoveActionInterceptor({});

    const handleClose = () => {
        if (!canClose) return;
        dispatch(deviceActions.dismissFirmwareAuthenticityCheck(deviceId));
        closeScreen();
    };

    return {
        canClose,
        handleClose,
    };
};
