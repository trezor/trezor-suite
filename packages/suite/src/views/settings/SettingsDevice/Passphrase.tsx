import { HELP_CENTER_PASSPHRASE_URL } from '@trezor/urls';
import { analytics, EventType } from '@trezor/suite-analytics';

import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { Switch } from '@trezor/components';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';

interface PassphraseProps {
    isDeviceLocked: boolean;
}

export const Passphrase = ({ isDeviceLocked }: PassphraseProps) => {
    const dispatch = useDispatch();
    const { device } = useDevice();

    const passphraseProtection = !!device?.features?.passphrase_protection;

    const handleChange = () => {
        dispatch(applySettings({ use_passphrase: !passphraseProtection }));
        analytics.report({
            type: EventType.SettingsDeviceChangePassphraseProtection,
            payload: {
                use_passphrase: !passphraseProtection,
            },
        });
    };

    // We don't want to let users disable passphrase anymore. But we should allow users with disabled passphrase to turn it on.
    if (passphraseProtection === true) return null;

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.Passphrase}>
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_PASSPHRASE_TITLE" />}
                description={<Translation id="TR_DEVICE_SETTINGS_PASSPHRASE_DESC" />}
                buttonLink={HELP_CENTER_PASSPHRASE_URL}
            />
            <ActionColumn>
                <Switch
                    isChecked={passphraseProtection}
                    onChange={handleChange}
                    data-testid="@settings/device/passphrase-switch"
                    isDisabled={isDeviceLocked}
                />
            </ActionColumn>
        </SettingsSectionItem>
    );
};
