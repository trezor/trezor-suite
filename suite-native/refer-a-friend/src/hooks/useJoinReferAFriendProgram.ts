import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectDeviceId } from '@suite-common/device';
import { joinReferralProgramThunk } from '@suite-common/refer-a-friend';
import { useDeviceReadyEvents } from '@suite-native/device-authorization';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import {
    ReferAFriendStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

type NavigationProps = StackNavigationProps<RootStackParamList, RootStackRoutes>;

export const useJoinReferAFriendProgram = () => {
    const navigation = useNavigation<NavigationProps>();
    const { waitForDevice } = useDeviceReadyEvents();
    const { dispatch } = useServices(injectDispatch);

    const deviceId = useSelector(selectDeviceId);

    return async () => {
        if (!deviceId) {
            return;
        }

        navigation.navigate(RootStackRoutes.ReferAFriendStack, {
            screen: ReferAFriendStackRoutes.JoinReferAFriendStack,
        });

        const isDeviceReady = await waitForDevice();
        if (!isDeviceReady) {
            return false;
        }

        await requestPrioritizedDeviceAccess(() =>
            dispatch(joinReferralProgramThunk({ deviceId })),
        );

        navigation.goBack();
    };
};
