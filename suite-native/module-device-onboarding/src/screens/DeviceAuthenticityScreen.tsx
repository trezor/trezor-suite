import { useCallback, useEffect } from 'react';

import { ContinueOnTrezorScreenContent, useDeviceAuthenticityCheck } from '@suite-native/device';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
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
