import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import { selectIsDeviceThpLocked } from '@suite-common/device';
import { selectThpAutoconnectStep, selectThpStep } from '@suite-common/thp';
import { useOnThpPairingCanceled } from '@suite-native/device-authorization';
import { useNavigateToInitialScreen } from '@suite-native/navigation';

export const useThpScreenDismissal = () => {
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const thpStep = useSelector(selectThpStep);
    const thpAutoconnectStep = useSelector(selectThpAutoconnectStep);
    const isDeviceThpLocked = useSelector(selectIsDeviceThpLocked);

    useOnThpPairingCanceled(navigateToInitialScreen);

    useFocusEffect(
        useCallback(() => {
            if (thpStep === null && thpAutoconnectStep === null && !isDeviceThpLocked) {
                navigateToInitialScreen();
            }
        }, [thpStep, thpAutoconnectStep, isDeviceThpLocked, navigateToInitialScreen]),
    );
};
