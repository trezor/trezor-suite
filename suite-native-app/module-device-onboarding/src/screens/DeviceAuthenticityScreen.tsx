import { useCallback, useEffect, useRef } from 'react';

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

    const startCheckDeviceAuthenticity = useCallback(() => {
        checkDeviceAuthenticity({ handleSuccess, handleFailure });
    }, [checkDeviceAuthenticity, handleSuccess, handleFailure]);

    // The check must not restart on every device update, but must not use an outdated device either
    // (as useCallback with ignored deps would). The ref is updated in an effect, as writing it during render is unsafe,
    // and before `useFocusEffect`, so that the focus effect always calls the latest version.
    const startCheckDeviceAuthenticityRef = useRef(startCheckDeviceAuthenticity);
    useEffect(() => {
        startCheckDeviceAuthenticityRef.current = startCheckDeviceAuthenticity;
    });

    useFocusEffect(useCallback(() => startCheckDeviceAuthenticityRef.current(), []));

    return (
        <DeviceOnboardingScreenWithExitButton
            onAlertContinueButtonPress={startCheckDeviceAuthenticity}
        >
            <ContinueOnTrezorScreenContent />
        </DeviceOnboardingScreenWithExitButton>
    );
};
