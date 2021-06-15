import { useEffect, useState } from 'react';

export const useShowConnectAndUnlockDeviceModal = (isDeviceConnected: boolean) => {
    const [showConnectAndUnlockDeviceModal, setShowConnectAndUnlockDeviceModal] = useState(
        !isDeviceConnected,
    );

    useEffect(() => {
        setShowConnectAndUnlockDeviceModal(!isDeviceConnected);
    }, [setShowConnectAndUnlockDeviceModal, isDeviceConnected]);

    return { showConnectAndUnlockDeviceModal, setShowConnectAndUnlockDeviceModal };
};
