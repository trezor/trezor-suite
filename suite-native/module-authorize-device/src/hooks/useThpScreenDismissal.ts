import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import { selectIsDeviceThpLocked } from '@suite-common/device';
import { selectThpAutoconnectStep, selectThpStep } from '@suite-common/thp';
import { useNavigateToInitialScreen } from '@suite-native/navigation';
import TrezorConnect, { DEVICE, DeviceThpPairingStatus } from '@trezor/connect';

export const useThpScreenDismissal = () => {
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const thpStep = useSelector(selectThpStep);
    const thpAutoconnectStep = useSelector(selectThpAutoconnectStep);
    const isDeviceThpLocked = useSelector(selectIsDeviceThpLocked);

    const onThpPairingStatusChange = useCallback(
        (e: DeviceThpPairingStatus) => {
            if (e.status === 'canceled') {
                navigateToInitialScreen();
            }
        },
        [navigateToInitialScreen],
    );

    useFocusEffect(
        useCallback(() => {
            TrezorConnect.on(DEVICE.THP_PAIRING_STATUS_CHANGED, onThpPairingStatusChange);

            return () => {
                TrezorConnect.off(DEVICE.THP_PAIRING_STATUS_CHANGED, onThpPairingStatusChange);
            };
        }, [onThpPairingStatusChange]),
    );

    useFocusEffect(
        useCallback(() => {
            if (thpStep === null && thpAutoconnectStep === null && !isDeviceThpLocked) {
                navigateToInitialScreen();
            }
        }, [thpStep, thpAutoconnectStep, isDeviceThpLocked, navigateToInitialScreen]),
    );
};
