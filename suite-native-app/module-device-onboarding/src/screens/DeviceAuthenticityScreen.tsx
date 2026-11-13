import { useCallback, useEffectEvent } from 'react';

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

    // Must not rerun `checkDeviceAuthenticity` on every device update, but should use current device (not cache outdated device, like useCallback with ignored deps would).
    const startCheckOnFocus = useEffectEvent(startCheckDeviceAuthenticity);

    // rules-of-hooks false negative: useEffectEvent must be only used in effect, but `useFocusEffect` is an effect too (not recognized by ESLint).
    // react-compiler is unfortunately disabled on this file; it cannot tell that the empty deps are correct (startCheckOnFocus not stable, but ref inside is).
    // eslint-disable-next-line react-hooks/rules-of-hooks, react-hooks/preserve-manual-memoization
    useFocusEffect(useCallback(() => startCheckOnFocus(), []));

    return (
        <DeviceOnboardingScreenWithExitButton
            onAlertContinueButtonPress={startCheckDeviceAuthenticity}
        >
            <ContinueOnTrezorScreenContent />
        </DeviceOnboardingScreenWithExitButton>
    );
};
