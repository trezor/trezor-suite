import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { useDispatch } from '@suite-common/redux-utils';
import { setIsOnboardingFeedbackBannerEnabled } from '@suite-native/banners';
import {
    type DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

type NavigationProps = StackNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes
>;

export const useOnDeviceOnboardingFinishedNavigation = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();

    const onDeviceOnboardingFinishedNavigation = useCallback(() => {
        dispatch(setIsOnboardingFeedbackBannerEnabled(true));
        navigation.navigate(DeviceOnboardingStackRoutes.Congratulations);
    }, [dispatch, navigation]);

    return { onDeviceOnboardingFinishedNavigation };
};
