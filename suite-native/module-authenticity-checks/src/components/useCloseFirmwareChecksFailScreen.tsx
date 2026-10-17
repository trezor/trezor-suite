import { useSelector } from 'react-redux';

import { deviceActions, selectSelectedDevice } from '@suite-common/device';
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
    const { handleClose: closeScreen } = useCloseDeviceCompromisedScreen();

    // Should always be true, but if not, fail-closed by not allowing to dismiss the failed check.
    const canClose = typeof device?.id === 'string';

    const handleClose = () => {
        if (!device?.id) return;

        dispatch(deviceActions.dismissFirmwareAuthenticityCheck(device.id));
        closeScreen();
    };

    return {
        canClose,
        handleClose,
    };
};
