import { useSelector } from 'react-redux';

import {
    deviceActions,
    selectIsDeviceInitialized,
    selectSelectedDevice,
} from '@suite-common/device';
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
    // But if it hasn't been initialized yet, there's no point in onboarding such a device (creating a wallet).
    const canClose = typeof device?.id === 'string' && isDeviceInitialized;

    const handleClose = () => {
        if (!device?.id || !isDeviceInitialized) return;

        dispatch(deviceActions.dismissFirmwareAuthenticityCheck(device.id));
        closeScreen();
    };

    return {
        canClose,
        handleClose,
    };
};
