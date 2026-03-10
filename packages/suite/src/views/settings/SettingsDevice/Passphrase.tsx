import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import { Switch, Tooltip } from '@trezor/components';
import { HELP_CENTER_PASSPHRASE_URL } from '@trezor/urls';

import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { ActionColumn, TextColumn } from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

interface PassphraseProps {
    isDeviceLocked: boolean;
}

export const Passphrase = ({ isDeviceLocked }: PassphraseProps) => {
    const dispatch = useDispatch();
    const { device } = useDevice();
    const analytics = useAnalytics();
    const passphraseProtection = !!device?.features?.passphrase_protection;

    const handleChange = () => {
        dispatch(applySettings({ use_passphrase: !passphraseProtection }));
        analytics.report({
            type: events.settingsDeviceChangePassphraseProtectionEvent.name,
            payload: {
                use_passphrase: !passphraseProtection,
            },
        });
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.Passphrase}>
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_PASSPHRASE_TITLE" />}
                description={<Translation id="TR_DEVICE_SETTINGS_PASSPHRASE_DESC" />}
                buttonLink={HELP_CENTER_PASSPHRASE_URL}
            />
            <ActionColumn>
                <Tooltip
                    isActive={isDeviceLocked}
                    content={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />}
                >
                    <Switch
                        isChecked={passphraseProtection}
                        onChange={handleChange}
                        data-testid="@settings/device/passphrase-switch"
                        isDisabled={isDeviceLocked}
                    />
                </Tooltip>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
