import { useCallback } from 'react';

import { useFocusEffect } from '@react-navigation/native';

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

    useFocusEffect(
        useCallback(() => {
            TrezorConnect.on(DEVICE.THP_PAIRING_STATUS_CHANGED, onThpPairingStatusChange);

            return () => {
                TrezorConnect.off(DEVICE.THP_PAIRING_STATUS_CHANGED, onThpPairingStatusChange);
            };
        }, [onThpPairingStatusChange]),
    );
};
