import { useCallback, useEffect } from 'react';

import TrezorConnect, { DEVICE, DeviceThpPairingStatus } from '@trezor/connect';

export const useOnThpPairingCanceled = (callback: () => void) => {
    const onThpPairingStatusChange = useCallback(
        (e: DeviceThpPairingStatus) => {
            if (e.status === 'canceled') {
                callback();
            }
        },
        [callback],
    );

    // We cannot use useFocusEffect here since a THP confirmation screen might be shown above.
    useEffect(() => {
        TrezorConnect.on(DEVICE.THP_PAIRING_STATUS_CHANGED, onThpPairingStatusChange);

        return () => {
            TrezorConnect.off(DEVICE.THP_PAIRING_STATUS_CHANGED, onThpPairingStatusChange);
        };
    }, [onThpPairingStatusChange]);
};
