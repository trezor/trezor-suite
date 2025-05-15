import { useCallback, useEffect } from 'react';

import { ContinueOnTrezorScreenContent, useDeviceAuthenticityCheck } from '@suite-native/device';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    StackProps,
} from '@suite-native/navigation';

import { DeviceOnboardingScreenWithExitButton } from '../components/DeviceOnboardingScreenWithExitButton';

export const DeviceAuthenticityScreen = ({
    navigation,
}: StackProps<DeviceOnboardingStackParamList, DeviceOnboardingStackRoutes.DeviceAuthenticity>) => {
    const { checkDeviceAuthenticity } = useDeviceAuthenticityCheck();

    const handleSuccess = useCallback(() => {
        navigation.navigate(DeviceOnboardingStackRoutes.DeviceAuthenticitySuccess);
    }, [navigation]);

    const startCheckDeviceAuthenticity = useCallback(() => {
        checkDeviceAuthenticity(handleSuccess);
    }, [checkDeviceAuthenticity, handleSuccess]);

    useEffect(() => {
        startCheckDeviceAuthenticity();

        // Start the check automatically on first render only
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <DeviceOnboardingScreenWithExitButton
            onAlertContinueButtonPress={startCheckDeviceAuthenticity}
        >
            <ContinueOnTrezorScreenContent />
        </DeviceOnboardingScreenWithExitButton>
    );
};
