import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectIsDeviceConnected, selectIsDeviceConnectedViaBluetooth } from '@suite-common/device';
import { forgetDeviceThunk } from '@suite-common/wallet-core';
import { selectIsKnownBluetoothDevice, useBluetoothDevice } from '@suite-native/bluetooth';
import { useTranslate } from '@suite-native/intl';
import {
    AppTabsRoutes,
    type DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    ForgetDeviceStackRoutes,
    HomeStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { useToast } from '@suite-native/toasts';

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.ForgetDevice,
    RootStackParamList
>;

export const useForgetDevice = () => {
    const navigation = useNavigation<NavigationProps>();
    const dispatch = useDispatch();

    const { showToast } = useToast();
    const { translate } = useTranslate();

    const { unpairBluetoothDevice } = useBluetoothDevice();

    const isDeviceConnectedViaBluetooth = useSelector(selectIsDeviceConnectedViaBluetooth);
    const isKnownBluetoothDevice = useSelector(selectIsKnownBluetoothDevice);
    const isDeviceConnected = useSelector(selectIsDeviceConnected);

    const forgetDeviceAndHandleNavigation = async () => {
        if (isDeviceConnected) {
            dispatch(forgetDeviceThunk({ isOsUnpairingFinished: true }));
            navigation.navigate(DeviceSettingsStackRoutes.ForgetDeviceStack, {
                screen: ForgetDeviceStackRoutes.ForgetDeviceFinish,
            });
        } else {
            // Awaited to ensure the home screen is already updated.
            await dispatch(forgetDeviceThunk({ isOsUnpairingFinished: true }));
            navigation.popTo(RootStackRoutes.AppTabs, {
                screen: AppTabsRoutes.HomeStack,
                params: {
                    screen: HomeStackRoutes.Home,
                },
            });
            showToast({
                icon: 'check',
                variant: 'default',
                message: translate('moduleDeviceSettings.forgetDevice.successToast'),
            });
        }
    };

    const forgetDevice = () => {
        if (isDeviceConnectedViaBluetooth) {
            navigation.navigate(DeviceSettingsStackRoutes.ForgetDeviceStack, {
                screen: ForgetDeviceStackRoutes.ForgetDeviceConfirmation,
            });
            unpairBluetoothDevice({
                onSuccess: () => dispatch(forgetDeviceThunk()),
                onCancel: navigation.goBack,
            });
        } else if (isKnownBluetoothDevice) {
            navigation.navigate(DeviceSettingsStackRoutes.ForgetDeviceStack, {
                screen: ForgetDeviceStackRoutes.ForgetDeviceGuide,
            });
        } else {
            forgetDeviceAndHandleNavigation();
        }
    };

    return {
        isKnownBluetoothDevice,
        forgetDevice,
        forgetDeviceAndHandleNavigation,
    };
};
