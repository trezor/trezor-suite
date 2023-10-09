import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectDeviceRequestedPin, selectDeviceType } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import {
    ConnectDeviceStackParamList,
    ConnectDeviceStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';

type NavigationProps = StackToStackCompositeNavigationProps<
    ConnectDeviceStackParamList,
    ConnectDeviceStackRoutes.ConnectDeviceCrossroads,
    RootStackParamList
>;

export const useConnectDevice = () => {
    const hasDeviceRequestedPin = useSelector(selectDeviceRequestedPin);

    const deviceType = useSelector(selectDeviceType);
    const navigation = useNavigation<NavigationProps>();
    const { showAlert, hideAlert } = useAlert();

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
        if (deviceType === 'unacquired') {
            showAlert({
                title: 'We found your connected device in incorrect state.',
                description: 'Please reconnect your device or ...',
                icon: 'warningCircle',
                pictogramVariant: 'red',
                primaryButtonTitle: 'Steal session',
                onPressPrimaryButton: () => {
                    // Get features steals session and starts communication again
                    TrezorConnect.getFeatures();
                },
            });
        } else {
            hideAlert();
        }
    }, [deviceType, hideAlert, showAlert]);
};
