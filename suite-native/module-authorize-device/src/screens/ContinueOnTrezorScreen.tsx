import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import {
    ContinueOnTrezorScreenContent,
    DeviceInteractionScreenWrapper,
} from '@suite-native/device';
import {
    DeviceAuthorizationStep,
    selectDeviceAuthorizationStep,
} from '@suite-native/device-authorization';
import { useNavigateToInitialScreen } from '@suite-native/navigation';

export const ContinueOnTrezorScreen = () => {
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const deviceAuthorizationStep = useSelector(selectDeviceAuthorizationStep);

    useFocusEffect(
        useCallback(() => {
            if (deviceAuthorizationStep === DeviceAuthorizationStep.Idle) {
                navigateToInitialScreen();
            }
        }, [deviceAuthorizationStep, navigateToInitialScreen]),
    );

    return (
        <DeviceInteractionScreenWrapper>
            <ContinueOnTrezorScreenContent />
        </DeviceInteractionScreenWrapper>
    );
};
