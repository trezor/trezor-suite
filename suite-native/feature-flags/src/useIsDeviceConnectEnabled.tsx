import { useAtom } from 'jotai';

import { atomWithUnecryptedStorage } from '@suite-native/storage';

const isDeviceConnectEnabledAtom = atomWithUnecryptedStorage<boolean>(
    'isDeviceConnectEnabledAtom',
    false,
);

export const useIsDeviceConnectEnabled = () => {
    const [isDeviceConnectEnabled, setIsDeviceConnectEnabled] = useAtom(isDeviceConnectEnabledAtom);

    return {
        isDeviceConnectEnabled,
        setIsDeviceConnectEnabled,
    };
};
