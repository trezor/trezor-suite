import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    ConnectDeviceStackRoutes,
    HomeStackParamList,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import {
    acquireDevice,
    selectDeviceRequestedPin,
    selectIsConnectedDeviceUninitialized,
    selectIsDeviceConnectedAndAuthorized,
    selectIsUnacquiredDevice,
} from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { useTranslate } from '@suite-native/intl';

type NavigationProps = StackToStackCompositeNavigationProps<
    HomeStackParamList,
    HomeStackRoutes.Home,
    RootStackParamList
>;

export const useDeviceConnect = () => {
    const hasDeviceRequestedPin = useSelector(selectDeviceRequestedPin);
    const isDeviceConnectedAndAuthorized = useSelector(selectIsDeviceConnectedAndAuthorized);
    const isUnacquiredDevice = useSelector(selectIsUnacquiredDevice);
    const isConnectedDeviceUninitialized = useSelector(selectIsConnectedDeviceUninitialized);

    const dispatch = useDispatch();

    const navigation = useNavigation<NavigationProps>();

    const { hideAlert, showAlert } = useAlert();

    const { translate } = useTranslate();

    useEffect(() => {
        if (hasDeviceRequestedPin) {
            navigation.navigate(RootStackRoutes.ConnectDevice, {
                screen: ConnectDeviceStackRoutes.PinMatrix,
            });
        }
    }, [hasDeviceRequestedPin, navigation]);

    // If device is unacquired (restarted app, another app fetched device session, ...),
    // we cannot work with device anymore. Shouldn't happen on mobile app but just in case.
    useEffect(() => {
        if (isUnacquiredDevice) {
            showAlert({
                title: translate('moduleDevice.unacquiredDeviceModal.title'),
                description: translate('moduleDevice.unacquiredDeviceModal.description'),
                icon: 'warningCircle',
                pictogramVariant: 'red',
                primaryButtonTitle: translate('moduleDevice.unacquiredDeviceModal.button'),
                onPressPrimaryButton: () => dispatch(acquireDevice()),
            });
        } else {
            hideAlert();
        }
    }, [dispatch, hideAlert, isUnacquiredDevice, showAlert, translate]);

    useEffect(() => {
        if (isConnectedDeviceUninitialized) {
            showAlert({
                title: translate('moduleDevice.noSeedModal.title'),
                description: translate('moduleDevice.noSeedModal.description'),
                icon: 'warningCircle',
                pictogramVariant: 'red',
                primaryButtonTitle: translate('moduleDevice.noSeedModal.button'),
            });
        }
    }, [isConnectedDeviceUninitialized, showAlert, translate]);

    useEffect(() => {
        if (isDeviceConnectedAndAuthorized) {
            navigation.navigate(RootStackRoutes.ConnectDevice, {
                screen: ConnectDeviceStackRoutes.ConnectingDevice,
            });
        }
    }, [hideAlert, isDeviceConnectedAndAuthorized, navigation]);
};
