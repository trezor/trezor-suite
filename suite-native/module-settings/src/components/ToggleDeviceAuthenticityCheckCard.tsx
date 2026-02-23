import { useDispatch, useSelector } from 'react-redux';

import { TouchableSwitchRow } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { SettingsStackRoutes } from '@suite-native/navigation';
import {
    selectIsDeviceAuthenticityCheckEnabled,
    setDeviceAuthenticityCheckEnabled,
} from '@suite-native/settings';
import { HELP_CENTER_DEVICE_AUTHENTICATION_MOBILE } from '@trezor/urls';

import { useSettingsNavigateTo } from '../navigation/useSettingsNavigateTo';

export const ToggleDeviceAuthenticityCheckCard = () => {
    const isDeviceAuthenticityCheckEnabled = useSelector(selectIsDeviceAuthenticityCheckEnabled);
    const dispatch = useDispatch();
    const navigateTo = useSettingsNavigateTo();
    const openLink = useOpenLink();

    const handleToggle = (value: boolean) => {
        if (value) {
            dispatch(setDeviceAuthenticityCheckEnabled(true));
        } else {
            navigateTo(SettingsStackRoutes.TurnOffDeviceAuthenticityCheck);
        }
    };

    const handleLearnMorePress = () => {
        openLink(HELP_CENTER_DEVICE_AUTHENTICATION_MOBILE);
    };

    return (
        <TouchableSwitchRow
            isChecked={isDeviceAuthenticityCheckEnabled}
            onChange={handleToggle}
            accessibilityLabel="device authenticity check"
            text={<Translation id="moduleSettings.advanced.authenticityChecks.device.title" />}
            description={
                <Translation id="moduleSettings.advanced.authenticityChecks.device.subtitle" />
            }
            icon="trezorDevices"
            onLearnMorePress={handleLearnMorePress}
        />
    );
};
