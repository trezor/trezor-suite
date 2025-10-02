import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isRejected } from '@reduxjs/toolkit';

import { removeThpAutoconnectThunk } from '@suite-common/thp';
import { selectDeviceAutoconnectCredentials } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { CompactCardWithIconLayout } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
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

export const DeviceAutoConnectCard = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProp>();

    const { translate } = useTranslate();
    const { showAlert } = useAlert();
    const { showToast } = useToast();
    const { startThpAutoconnect } = useThpAutoconnectActions();

    const autoconnectCredentials = useSelector(selectDeviceAutoconnectCredentials);

    const title =
        autoconnectCredentials.length > 0
            ? translate('moduleDeviceSettings.autoconnect.disable.title')
            : translate('moduleDeviceSettings.autoconnect.enable.title');
    const subtitle =
        autoconnectCredentials.length > 0
            ? translate('moduleDeviceSettings.autoconnect.disable.subtitle')
            : translate('moduleDeviceSettings.autoconnect.enable.subtitle');

    const onAutoconnectTurnOff = useCallback(async () => {
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
    }, [dispatch, showToast, autoconnectCredentials]);

    const handleTurnOffAutoconnect = useCallback(() => {
        showAlert({
            title: <Translation id="moduleDeviceSettings.autoconnect.disable.title" />,
            description: <Translation id="moduleDeviceSettings.autoconnect.disable.description" />,
            primaryButtonTitle: (
                <Translation id="moduleDeviceSettings.autoconnect.disable.turnOnButton" />
            ),
            onPressPrimaryButton: onAutoconnectTurnOff,
            secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
        });
    }, [showAlert, onAutoconnectTurnOff]);

    const onAutoconnectTurnOn = useCallback(async () => {
        navigation.navigate(DeviceSettingsStackRoutes.ContinueOnTrezor);

        const result = await startThpAutoconnect();

        if (result && isRejected(result)) {
            TrezorConnect.cancel();
            showToast({
                variant: 'error',
                message: <Translation id="moduleDeviceSettings.autoconnect.enable.error" />,
            });
        }
        navigation.goBack();
    }, [navigation, startThpAutoconnect, showToast]);

    const handleTurnOnAutoconnect = useCallback(() => {
        showAlert({
            title: <Translation id="moduleDeviceSettings.autoconnect.enable.title" />,
            description: <Translation id="moduleDeviceSettings.autoconnect.enable.description" />,
            primaryButtonTitle: (
                <Translation id="moduleDeviceSettings.autoconnect.enable.turnOnButton" />
            ),
            onPressPrimaryButton: onAutoconnectTurnOn,
            secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
        });
    }, [showAlert, onAutoconnectTurnOn]);

    const onPress = useCallback(() => {
        if (autoconnectCredentials.length > 0) {
            handleTurnOffAutoconnect();
        } else {
            handleTurnOnAutoconnect();
        }
    }, [autoconnectCredentials.length, handleTurnOnAutoconnect, handleTurnOffAutoconnect]);

    return (
        <CompactCardWithIconLayout
            icon="trezorSafe5"
            title={title}
            subtitle={subtitle}
            onPress={onPress}
        />
    );
};
