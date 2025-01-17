import { useHandleDeviceConnection } from '@suite-native/device';
import { useConnectPopupNavigation } from '@suite-native/module-connect-popup';

import { useCoinEnablingInitialCheck } from './useCoinEnablingInitialCheck';

/**
 * @description This hook is used to initialize all the hooks,
 * that are supposed to be active globally once the app is ready.
 */
export const useGlobalHooks = () => {
    useHandleDeviceConnection();
    useCoinEnablingInitialCheck();
    useConnectPopupNavigation();
};
