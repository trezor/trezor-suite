import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isRejected } from '@reduxjs/toolkit';

import { selectSelectedDevice } from '@suite-common/device';
import { removeThpCredentialsThunk } from '@suite-common/thp';
import { useTranslate } from '@suite-native/intl';
import {
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { useThpAutoconnectActions } from '@suite-native/thp';
import { useToast } from '@suite-native/toasts';
import TrezorConnect from '@trezor/connect';

import { selectDeviceAutoConnectCredentials } from '../selectors';

type NavigationProp = StackNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.DeviceSettings
>;

export const useDeviceAutoConnect = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProp>();

    const { showToast } = useToast();
    const { translate } = useTranslate();

    const { startThpAutoconnect } = useThpAutoconnectActions();

    const device = useSelector(selectSelectedDevice);
    const autoConnectCredentials = useSelector(selectDeviceAutoConnectCredentials);
    const isAutoConnectEnabled = autoConnectCredentials.length > 0;

    const enableAutoConnect = useCallback(async () => {
        const result = await startThpAutoconnect();

        if (result && isRejected(result)) {
            TrezorConnect.cancel();
            showToast({
                variant: 'error',
                message: translate('moduleDeviceSettings.autoconnect.enable.error'),
            });
        } else {
            showToast({
                variant: 'success',
                message: translate('moduleDeviceSettings.autoconnect.enable.successToast'),
            });
        }
        navigation.goBack();
    }, [navigation, startThpAutoconnect, showToast, translate]);

    const disableAutoConnect = useCallback(() => {
        dispatch(
            removeThpCredentialsThunk({
                device,
                credentials: autoConnectCredentials,
            }),
        );
    }, [dispatch, device, autoConnectCredentials]);

    const toggleAutoConnect = useCallback(() => {
        if (!isAutoConnectEnabled) {
            navigation.navigate(DeviceSettingsStackRoutes.DeviceAutoConnectStack);
        } else {
            disableAutoConnect();
        }
    }, [isAutoConnectEnabled, navigation, disableAutoConnect]);

    return {
        isAutoConnectEnabled,
        enableAutoConnect,
        toggleAutoConnect,
    };
};
