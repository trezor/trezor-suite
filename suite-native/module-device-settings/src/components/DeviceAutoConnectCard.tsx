import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectDeviceAutoconnectCredentials } from '@suite-common/wallet-core';
import { CompactCardWithIconLayout } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { useThpAutoconnectAlerts } from '@suite-native/thp';

export const DeviceAutoConnectCard = () => {
    const { translate } = useTranslate();
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
        if (autoconnectCredentials.length > 0) {
            showThpAutoconnectTurnOffAlert();
        } else {
            showThpAutoconnectTurnOnAlert();
        }
    }, [showThpAutoconnectTurnOffAlert, showThpAutoconnectTurnOnAlert, autoconnectCredentials]);

    return (
        <CompactCardWithIconLayout
            icon="trezorSafe5"
            title={title}
            subtitle={subtitle}
            onPress={onPress}
        />
    );
};
