import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import {
    ContinueOnTrezorScreenContent,
    DeviceInteractionScreenWrapper,
} from '@suite-native/device';
import { DeviceState, selectDeviceState } from '@suite-native/device-authorization';
import { useNavigateToInitialScreen } from '@suite-native/navigation';

export const ContinueOnTrezorScreen = () => {
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const deviceState = useSelector(selectDeviceState);

    useFocusEffect(
        useCallback(() => {
            if (deviceState === DeviceState.Idle) {
                navigateToInitialScreen();
            }
        }, [deviceState, navigateToInitialScreen]),
    );

    return (
        <DeviceInteractionScreenWrapper>
            <ContinueOnTrezorScreenContent />
        </DeviceInteractionScreenWrapper>
    );
};
