import { useDispatch, useSelector } from 'react-redux';

import { Translation } from '@suite-native/intl';
import { SettingsStackRoutes } from '@suite-native/navigation';
import {
    selectIsDeviceAuthenticityCheckEnabled,
    setDeviceAuthenticityCheckEnabled,
} from '@suite-native/settings';
import { HELP_CENTER_DEVICE_AUTHENTICATION_MOBILE } from '@trezor/urls';

import { TurnOffCheckCard } from './TurnOffCheckCard';
import { useSettingsNavigateTo } from '../navigation/useSettingsNavigateTo';

export const TurnOffDeviceAuthenticityCheckCard = () => {
    const isDeviceAuthenticityCheckEnabled = useSelector(selectIsDeviceAuthenticityCheckEnabled);
    const dispatch = useDispatch();
    const navigateTo = useSettingsNavigateTo();

    const handleTurnOn = () => {
        dispatch(setDeviceAuthenticityCheckEnabled(true));
    };

    const handleTurnOff = () => {
        navigateTo(SettingsStackRoutes.TurnOffDeviceAuthenticityCheck);
    };

    return (
        <TurnOffCheckCard
            isEnabled={isDeviceAuthenticityCheckEnabled}
            title={<Translation id="moduleSettings.advanced.authenticityChecks.device.title" />}
            subtitle={
                <Translation id="moduleSettings.advanced.authenticityChecks.device.subtitle" />
            }
            icon="trezorDevices"
            learnMoreUrl={HELP_CENTER_DEVICE_AUTHENTICATION_MOBILE}
            onTurnOn={handleTurnOn}
            onTurnOff={handleTurnOff}
        />
    );
};
