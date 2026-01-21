import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import {
    DeviceAuthorizationStep,
    selectDeviceAuthorizationStep,
} from '@suite-native/device-authorization';
import { useNavigateToInitialScreen } from '@suite-native/navigation';

export const useHandleNavigateToInitialScreenOnIdle = () => {
    const deviceAuthorizationStep = useSelector(selectDeviceAuthorizationStep);
    const navigateToInitialScreen = useNavigateToInitialScreen();

    useFocusEffect(
        useCallback(() => {
            if (deviceAuthorizationStep === DeviceAuthorizationStep.Idle) {
                navigateToInitialScreen();
            }
        }, [deviceAuthorizationStep, navigateToInitialScreen]),
    );
};
