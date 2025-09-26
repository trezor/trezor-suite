import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectDeviceAutoconnectCredentials } from '@suite-common/wallet-core';
import { CompactCardWithIconLayout } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import {
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { useThpAutoconnectAlerts } from '@suite-native/thp';

type NavigationProp = StackNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.DeviceSettings
>;

export const DeviceAutoConnectCard = () => {
    const { translate } = useTranslate();

    const navigation = useNavigation<NavigationProp>();

    const { showThpAutoconnectTurnOffAlert, showThpAutoconnectTurnOnAlert } =
        useThpAutoconnectAlerts();

    const autoconnectCredentials = useSelector(selectDeviceAutoconnectCredentials);

    const title =
        autoconnectCredentials.length > 0
            ? translate('moduleDeviceSettings.autoconnect.disable.title')
            : translate('moduleDeviceSettings.autoconnect.enable.title');
    const subtitle =
        autoconnectCredentials.length > 0
            ? translate('moduleDeviceSettings.autoconnect.disable.subtitle')
            : translate('moduleDeviceSettings.autoconnect.enable.subtitle');

    const onPress = useCallback(() => {
        navigation.navigate(DeviceSettingsStackRoutes.ContinueOnTrezor);
        if (autoconnectCredentials.length > 0) {
            showThpAutoconnectTurnOffAlert();
        } else {
            showThpAutoconnectTurnOnAlert();
        }
    }, [
        navigation,
        autoconnectCredentials.length,
        showThpAutoconnectTurnOffAlert,
        showThpAutoconnectTurnOnAlert,
    ]);

    return (
        <CompactCardWithIconLayout
            icon="trezorSafe5"
            title={title}
            subtitle={subtitle}
            onPress={onPress}
        />
    );
};
