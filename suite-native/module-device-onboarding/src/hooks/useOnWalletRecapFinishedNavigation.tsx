import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectIsDeviceProtectedByPin } from '@suite-common/device';
import {
    type DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    type RootStackParamList,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

import { useOnDeviceOnboardingFinishedNavigation } from './useOnDeviceOnboardingFinishedNavigation';
import { useReportOnboardingSuccessAnalytics } from './useReportOnboardingSuccessAnalytics';

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    RootStackParamList
>;

export const useOnWalletRecapFinishedNavigation = () => {
    const navigation = useNavigation<NavigationProps>();

    const isDeviceProtectedByPin = useSelector(selectIsDeviceProtectedByPin);

    const { onDeviceOnboardingFinishedNavigation } = useOnDeviceOnboardingFinishedNavigation();
    const reportOnboardingSuccessAnalytics = useReportOnboardingSuccessAnalytics();

    const onWalletRecapFinishedNavigation = useCallback(() => {
        if (isDeviceProtectedByPin) {
            onDeviceOnboardingFinishedNavigation();
            reportOnboardingSuccessAnalytics({ wasPinSkipped: false });
        } else {
            navigation.navigate(DeviceOnboardingStackRoutes.CreatePin);
        }
    }, [
        isDeviceProtectedByPin,
        navigation,
        onDeviceOnboardingFinishedNavigation,
        reportOnboardingSuccessAnalytics,
    ]);

    return { onWalletRecapFinishedNavigation };
};
