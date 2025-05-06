import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectSelectedDeviceAuthenticity } from '@suite-common/wallet-core';
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
    const [isCheckActive, setIsCheckActive] = useState(false);
    const { checkDeviceAuthenticity } = useDeviceAuthenticityCheck();
    const selectedDeviceAuthenticity = useSelector(selectSelectedDeviceAuthenticity);

    // Soft error meaning we are not sure if the device is compromised.
    // We need to retry, and the user cannot proceed past this screen,
    // but we do not report this to the user as a compromised device.
    // This includes actions such as canceling on the device or disconnecting the device.
    const hasSoftError: boolean =
        !!selectedDeviceAuthenticity?.error && selectedDeviceAuthenticity?.valid !== false;

    const handleSuccess = useCallback(() => {
        navigation.navigate(DeviceOnboardingStackRoutes.DeviceAuthenticitySuccess);
    }, [navigation]);

    useEffect(() => {
        if (hasSoftError) {
            // If authenticity check failed retry the check automatically.
            setIsCheckActive(false);
        }
    }, [hasSoftError]);

    useEffect(() => {
        if (!isCheckActive) {
            setIsCheckActive(true);
            checkDeviceAuthenticity(handleSuccess);
        }
    }, [checkDeviceAuthenticity, handleSuccess, isCheckActive]);

    return (
        <DeviceOnboardingScreenWithExitButton>
            <ContinueOnTrezorScreenContent />
        </DeviceOnboardingScreenWithExitButton>
    );
};
