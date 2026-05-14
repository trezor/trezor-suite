import { useState } from 'react';
import { useSelector } from 'react-redux';

import { selectIsDeviceConnected } from '@suite-common/device';
import { selectIsDeviceConnectedAndThpUnlocked } from '@suite-native/device';

export const useDeviceConnectionGuard = () => {
    const [wasDeviceInitiallyConnected] = useState(useSelector(selectIsDeviceConnected));
    const isDeviceConnectedAndThpUnlocked = useSelector(selectIsDeviceConnectedAndThpUnlocked);

    // There are two situations we need to distinguish because of THP devices:
    // 1) Device is already connected => we don't need to show the connection guard.
    // 2) Device is not yet connected => we have to wait for it to be connected and THP unlocked.
    // If we don't do that, TrezorConnect calls get queued behind acquireDevice() triggered from
    // deviceConnectThunks upon device connection, and that causes UX issues.
    const isDeviceConnectionGuardVisible =
        !wasDeviceInitiallyConnected && !isDeviceConnectedAndThpUnlocked;

    return { isDeviceConnectionGuardVisible };
};
