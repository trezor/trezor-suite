import { useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/device';
import { useReportDeviceCompromised } from '@suite-common/firmware-authenticity';
import { useBlockchainConnectionManager } from '@suite-native/blockchain';
import { useBluetoothAdapter } from '@suite-native/bluetooth';
import {
    useDetectDeviceError,
    useDeviceCompromisedNotification,
    useRenderDeviceDangerBanner,
    useRetryFwAuthenticityChecks,
} from '@suite-native/device';
import { useHandleDeviceAuthorization } from '@suite-native/device-authorization';
import { useConnectPopupNavigation } from '@suite-native/module-connect-popup';

/**
 * @description This hook is used to initialize all the hooks,
 * that are supposed to be active globally once the app is ready.
 */
export const useGlobalHooks = () => {
    const device = useSelector(selectSelectedDevice);

    useBlockchainConnectionManager();
    useConnectPopupNavigation();

    useBluetoothAdapter();

    useDetectDeviceError();
    useHandleDeviceAuthorization();
    useReportDeviceCompromised({ device, selectAllowPrerelease: () => false });
    useRenderDeviceDangerBanner();
    useDeviceCompromisedNotification();

    useRetryFwAuthenticityChecks();
};
