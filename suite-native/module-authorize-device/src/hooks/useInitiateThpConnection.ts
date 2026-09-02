import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';

import { selectSelectedDevice } from '@suite-common/device';
import { useDispatch } from '@suite-common/redux-utils';
import { acquireDeviceThunk } from '@suite-common/wallet-core';
import {
    type AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
} from '@suite-native/navigation';

type NavigationProp = NativeStackNavigationProp<AuthorizeDeviceStackParamList>;

export const useInitiateThpConnection = () => {
    const navigation = useNavigation<NavigationProp>();
    const dispatch = useDispatch();

    const device = useSelector(selectSelectedDevice);

    const initiateThpConnection = () => {
        // Navigate as soon as the action is called, do not wait for deviceConnectionMiddleware to
        // do that. In addition to better UX, this also prevents the current screen from multiplying
        // in the navigation stack and the invalidCode alert from reappearing once dismissed.
        navigation.replace(AuthorizeDeviceStackRoutes.ThpConfirmation);
        dispatch(acquireDeviceThunk({ requestedDevice: device }));
    };

    return {
        initiateThpConnection,
    };
};
