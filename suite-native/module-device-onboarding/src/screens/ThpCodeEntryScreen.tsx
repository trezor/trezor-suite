import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectIsDeviceThpLocked } from '@suite-common/device';
import { selectThpStep } from '@suite-common/thp';
import {
    type DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    type StackProps,
} from '@suite-native/navigation';
import { ThpCodeEntryScreenContent } from '@suite-native/thp';

import { NonClosableDeviceOnboardingScreen } from '../components/NonClosableDeviceOnboardingScreen';
import { useInitiateThpConnection } from '../hooks/useInitiateThpConnection';

export const ThpCodeEntryScreen = ({
    navigation,
}: StackProps<DeviceOnboardingStackParamList, DeviceOnboardingStackRoutes.ThpCodeEntry>) => {
    const { initiateThpConnection } = useInitiateThpConnection();

    const thpStep = useSelector(selectThpStep);
    const isDeviceThpLocked = useSelector(selectIsDeviceThpLocked);

    useEffect(() => {
        if (thpStep === 'BeforeConnectionInfo') {
            navigation.replace(DeviceOnboardingStackRoutes.ThpPairingInfo);
        } else if (!isDeviceThpLocked) {
            navigation.replace(DeviceOnboardingStackRoutes.ThpPairingSuccess);
        }
    }, [thpStep, isDeviceThpLocked, navigation]);

    return (
        <NonClosableDeviceOnboardingScreen>
            <ThpCodeEntryScreenContent onRetry={initiateThpConnection} />
        </NonClosableDeviceOnboardingScreen>
    );
};
