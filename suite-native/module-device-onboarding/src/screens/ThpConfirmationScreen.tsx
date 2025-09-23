import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectThpStep } from '@suite-common/thp';
import { ContinueOnTrezorScreenContent } from '@suite-native/device';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    StackProps,
} from '@suite-native/navigation';

import { NonClosableDeviceOnboardingScreen } from '../components/NonClosableDeviceOnboardingScreen';

export const ThpConfirmationScreen = ({
    navigation,
}: StackProps<DeviceOnboardingStackParamList, DeviceOnboardingStackRoutes.ThpConfirmation>) => {
    const thpStep = useSelector(selectThpStep);

    useEffect(() => {
        if (thpStep === 'BeforeConnectionInfo') {
            navigation.navigate(DeviceOnboardingStackRoutes.ThpPairingInfo);
        } else if (thpStep === 'CodeEntry') {
            navigation.navigate(DeviceOnboardingStackRoutes.ThpCodeEntry);
        } else if (thpStep === null) {
            navigation.navigate(DeviceOnboardingStackRoutes.ThpPairingSuccess);
        }
    }, [thpStep, navigation]);

    return (
        <NonClosableDeviceOnboardingScreen noBottomPadding={true} hasBottomInset={false}>
            <ContinueOnTrezorScreenContent />
        </NonClosableDeviceOnboardingScreen>
    );
};
