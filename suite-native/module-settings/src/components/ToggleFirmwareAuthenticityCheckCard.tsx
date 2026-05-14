import { useDispatch, useSelector } from 'react-redux';

import { TouchableSwitchRow } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { SettingsStackRoutes } from '@suite-native/navigation';
import {
    selectIsFirmwareAuthenticityCheckEnabled,
    setCheckFirmwareAuthenticityEnabled,
} from '@suite-native/settings';
import { HELP_CENTER_FIRMWARE_REVISION_CHECK_MOBILE } from '@trezor/urls';

import { useSettingsNavigateTo } from '../navigation/useSettingsNavigateTo';

export const ToggleFirmwareAuthenticityCheckCard = () => {
    const isFwAuthenticityCheckEnabled = useSelector(selectIsFirmwareAuthenticityCheckEnabled);
    const dispatch = useDispatch();
    const navigateTo = useSettingsNavigateTo();
    const openLink = useOpenLink();

    const handleToggle = (value: boolean) => {
        if (value) {
            dispatch(setCheckFirmwareAuthenticityEnabled(true));
        } else {
            navigateTo(SettingsStackRoutes.TurnOffFirmwareAuthenticityCheck);
        }
    };

    const handleLearnMorePress = () => {
        openLink(HELP_CENTER_FIRMWARE_REVISION_CHECK_MOBILE);
    };

    return (
        <TouchableSwitchRow
            isChecked={isFwAuthenticityCheckEnabled}
            onChange={handleToggle}
            accessibilityLabel="firmware authenticity check"
            text={<Translation id="moduleSettings.advanced.authenticityChecks.firmware.title" />}
            description={
                <Translation id="moduleSettings.advanced.authenticityChecks.firmware.subtitle" />
            }
            icon="shieldCheck"
            onLearnMorePress={handleLearnMorePress}
        />
    );
};
