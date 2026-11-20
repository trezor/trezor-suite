import { useCallback, useState } from 'react';

import { useFocusEffect } from '@react-navigation/native';

import { ContinueOnTrezorScreenContent, useDeviceAuthenticityCheck } from '@suite-native/device';
import {
    type DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
    useInterceptNativeNavigation,
} from '@suite-native/navigation';

import { DeviceOnboardingScreenWithExitButton } from '../components/DeviceOnboardingScreenWithExitButton';

type NavigationProp = StackToStackCompositeNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.DeviceAuthenticity,
    RootStackParamList
>;

export const DeviceAuthenticityScreen = ({ navigation }: { navigation: NavigationProp }) => {
    const [isDeviceAuthenticityCheckStarted, setIsDeviceAuthenticityCheckStarted] = useState(false);
    const { checkDeviceAuthenticity } = useDeviceAuthenticityCheck();
    useInterceptNativeNavigation();

    const handleSuccess = useCallback(() => {
        navigation.navigate(DeviceOnboardingStackRoutes.DeviceAuthenticitySuccess);
    }, [navigation]);
    const handleFailure = useCallback(() => {
        navigation.navigate(RootStackRoutes.DeviceCompromisedModal, {
            failedCheck: 'device-authenticity',
        });
    }, [navigation]);

    const startCheckDeviceAuthenticity = useCallback(async () => {
        await checkDeviceAuthenticity({ handleSuccess, handleFailure });
        setIsDeviceAuthenticityCheckStarted(false);
    }, [checkDeviceAuthenticity, handleSuccess, handleFailure]);

    useFocusEffect(
        useCallback(() => {
            if (!isDeviceAuthenticityCheckStarted) {
                setIsDeviceAuthenticityCheckStarted(true);
                startCheckDeviceAuthenticity();
            }
            // Note that checkDeviceAuthenticity is an unstable memo (invalidates with DEVICE.CHANGED),
            // but isDeviceAuthenticityCheckStarted takes care that the check is not fired repeatedly.
        }, [startCheckDeviceAuthenticity, isDeviceAuthenticityCheckStarted]),
    );

    return (
        <DeviceOnboardingScreenWithExitButton
            onAlertContinueButtonPress={startCheckDeviceAuthenticity}
        >
            <ContinueOnTrezorScreenContent />
        </DeviceOnboardingScreenWithExitButton>
    );
};
