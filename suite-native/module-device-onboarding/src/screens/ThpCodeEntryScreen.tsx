import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectThpStep } from '@suite-common/thp';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    StackProps,
} from '@suite-native/navigation';
import { ThpCodeEntryScreenContent } from '@suite-native/thp';

import { NonClosableDeviceOnboardingScreen } from '../components/NonClosableDeviceOnboardingScreen';
import { useInitiateThpConnection } from '../hooks/useInitiateThpConnection';

export const ThpCodeEntryScreen = ({
    navigation,
}: StackProps<DeviceOnboardingStackParamList, DeviceOnboardingStackRoutes.ThpCodeEntry>) => {
    const { initiateThpConnection } = useInitiateThpConnection();

    const thpStep = useSelector(selectThpStep);

    useEffect(() => {
        if (thpStep === null) {
            navigation.navigate(DeviceOnboardingStackRoutes.ThpPairingSuccess);
        }
    }, [thpStep, navigation]);

    return (
        <NonClosableDeviceOnboardingScreen>
            <ThpCodeEntryScreenContent onRetry={initiateThpConnection} />
        </NonClosableDeviceOnboardingScreen>
    );
};
