import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { setIsOnboardingFeedbackBannerEnabled } from '@suite-native/banners';
import {
    type DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

type NavigationProps = StackNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes
>;

export const useOnDeviceOnboardingFinishedNavigation = () => {
    const { dispatch } = useServices(injectDispatch);
    const navigation = useNavigation<NavigationProps>();

    const onDeviceOnboardingFinishedNavigation = useCallback(() => {
        dispatch(setIsOnboardingFeedbackBannerEnabled(true));
        navigation.navigate(DeviceOnboardingStackRoutes.Congratulations);
    }, [dispatch, navigation]);

    return { onDeviceOnboardingFinishedNavigation };
};
