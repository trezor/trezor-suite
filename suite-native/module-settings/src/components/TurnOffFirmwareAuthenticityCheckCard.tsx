import { useDispatch, useSelector } from 'react-redux';

import { Translation } from '@suite-native/intl';
import { SettingsStackRoutes } from '@suite-native/navigation';
import {
    selectIsFirmwareAuthenticityCheckEnabled,
    setCheckFirmwareAuthenticityEnabled,
} from '@suite-native/settings';
import { HELP_CENTER_FIRMWARE_REVISION_CHECK_MOBILE } from '@trezor/urls';

import { TurnOffCheckCard } from './TurnOffCheckCard';
import { useSettingsNavigateTo } from '../navigation/useSettingsNavigateTo';

export const TurnOffFirmwareAuthenticityCheckCard = () => {
    const isFwAuthenticityCheckEnabled = useSelector(selectIsFirmwareAuthenticityCheckEnabled);
    const dispatch = useDispatch();
    const navigateTo = useSettingsNavigateTo();

    const handleTurnOn = () => {
        dispatch(setCheckFirmwareAuthenticityEnabled(true));
    };

    const handleTurnOff = () => {
        navigateTo(SettingsStackRoutes.TurnOffFirmwareAuthenticityCheck);
    };

    return (
        <TurnOffCheckCard
            isEnabled={isFwAuthenticityCheckEnabled}
            title={<Translation id="moduleSettings.advanced.authenticityChecks.firmware.title" />}
            subtitle={
                <Translation id="moduleSettings.advanced.authenticityChecks.firmware.subtitle" />
            }
            icon="shieldCheck"
            learnMoreUrl={HELP_CENTER_FIRMWARE_REVISION_CHECK_MOBILE}
            onTurnOn={handleTurnOn}
            onTurnOff={handleTurnOff}
        />
    );
};
