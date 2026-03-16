import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectIsDeviceThpLocked } from '@suite-common/device';
import { selectThpStep } from '@suite-common/thp';
import { ContinueOnTrezorScreenContent } from '@suite-native/device';
import {
    type DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    type StackProps,
    useInterceptNativeNavigation,
} from '@suite-native/navigation';

import { NonClosableDeviceOnboardingScreen } from '../components/NonClosableDeviceOnboardingScreen';

export const ThpConfirmationScreen = ({
    navigation,
}: StackProps<DeviceOnboardingStackParamList, DeviceOnboardingStackRoutes.ThpConfirmation>) => {
    const thpStep = useSelector(selectThpStep);
    const isDeviceThpLocked = useSelector(selectIsDeviceThpLocked);

    useInterceptNativeNavigation();

    useEffect(() => {
        if (thpStep === 'BeforeConnectionInfo') {
            navigation.replace(DeviceOnboardingStackRoutes.ThpPairingInfo);
        } else if (thpStep === 'CodeEntry') {
            navigation.replace(DeviceOnboardingStackRoutes.ThpCodeEntry);
        } else if (!isDeviceThpLocked) {
            navigation.replace(DeviceOnboardingStackRoutes.ThpPairingSuccess);
        }
    }, [thpStep, isDeviceThpLocked, navigation]);

    return (
        <NonClosableDeviceOnboardingScreen noBottomPadding={true} hasBottomInset={false}>
            <ContinueOnTrezorScreenContent />
        </NonClosableDeviceOnboardingScreen>
    );
};
