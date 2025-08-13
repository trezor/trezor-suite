import { useReportDeviceCompromised } from '@suite-common/firmware-authenticity';
import { useBluetoothAdapter } from '@suite-native/bluetooth';
import {
    useDetectDeviceError,
    useDeviceCompromisedNotification,
    useHandleDeviceConnection,
    useRenderDeviceDangerBanner,
    useRetryFwAuthenticityChecks,
} from '@suite-native/device';
import { useConnectPopupNavigation } from '@suite-native/module-connect-popup';

/**
 * @description This hook is used to initialize all the hooks,
 * that are supposed to be active globally once the app is ready.
 */
export const useGlobalHooks = () => {
    useConnectPopupNavigation();

    useBluetoothAdapter();

    useHandleDeviceConnection();
    useDetectDeviceError();
    useReportDeviceCompromised();
    useRenderDeviceDangerBanner();
    useDeviceCompromisedNotification();

    useRetryFwAuthenticityChecks();
};
