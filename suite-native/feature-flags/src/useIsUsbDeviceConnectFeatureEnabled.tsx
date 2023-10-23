import { Platform } from 'react-native';

import { useAtom } from 'jotai';

import { atomWithUnecryptedStorage } from '@suite-native/storage';
import { isDevelopOrDebugEnv } from '@suite-native/config';

const isDeviceConnectEnabledAtom = atomWithUnecryptedStorage<boolean>(
    'isDeviceConnectEnabledAtom',
    Platform.OS === 'android' && isDevelopOrDebugEnv(),
);

export const useIsUsbDeviceConnectFeatureEnabled = () => {
    const [isUsbDeviceConnectFeatureEnabled, setIsUsbDeviceConnectFeatureEnabled] = useAtom(
        isDeviceConnectEnabledAtom,
    );

    return {
        isUsbDeviceConnectFeatureEnabled,
        setIsUsbDeviceConnectFeatureEnabled,
    };
};
