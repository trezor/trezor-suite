import { CommonActions, useNavigation } from '@react-navigation/native';

import { useDispatch } from '@suite-common/redux-utils';
import { postOnboardingInitThunk } from '@suite-native/app-init';
import { HomeStackRoutes, RootStackRoutes } from '@suite-native/navigation';
import { setIsOnboardingFinished } from '@suite-native/settings';

export const useExitOnboardingFlow = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();

    return () => {
        dispatch(setIsOnboardingFinished());
        dispatch(postOnboardingInitThunk());

        // TODO: COSMETIC IMPROVEMENT: redirect to home only if there is no device connected. In case of device connected,
        // the redirect is handled in useHandleDeviceConnection hook. in reaction to the `setIsOnboardingFinished` call.
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [
                    {
                        name: RootStackRoutes.AppTabs,
                        params: { screen: HomeStackRoutes.Home },
                    },
                ],
            }),
        );
    };
};
