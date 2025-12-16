import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isRejected } from '@reduxjs/toolkit';

import { removeThpAutoconnectThunk } from '@suite-common/thp';
import {
    selectDeviceAutoconnectCredentials,
    selectIsDeviceConnected,
} from '@suite-common/wallet-core';
import { useTranslate } from '@suite-native/intl';
import {
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { useThpAutoconnectActions } from '@suite-native/thp';
import { useToast } from '@suite-native/toasts';
import TrezorConnect from '@trezor/connect';

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

    const isDeviceConnected = useSelector(selectIsDeviceConnected);
    const autoconnectCredentials = useSelector(selectDeviceAutoconnectCredentials);

    const turnAutoConnectOn = useCallback(async () => {
        navigation.navigate(DeviceSettingsStackRoutes.DeviceAutoConnectStack);

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

    const turnAutoConnectOff = useCallback(async () => {
        if (!isDeviceConnected) {
            // We cannot use AutoConnectStack since there's no progress screen once connected.
            navigation.navigate(DeviceSettingsStackRoutes.DeviceAutoConnectGuard);
        }

        const result = await dispatch(
            removeThpAutoconnectThunk({
                credentials: autoconnectCredentials,
            }),
        ).unwrap();

        if (isRejected(result)) {
            showToast({
                variant: 'error',
                message: result.error.message,
            });
        }
    }, [isDeviceConnected, navigation, dispatch, autoconnectCredentials, showToast]);

    return {
        isAutoconnectEnabled: autoconnectCredentials.length > 0,
        turnAutoConnectOn,
        turnAutoConnectOff,
    };
};
