import React from 'react';
import { HELP_CENTER_PASSPHRASE_URL } from '@trezor/urls';
import { analytics, EventType } from '@trezor/suite-analytics';

import { Translation } from 'src/components/suite';
import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite/Settings';
import { Switch } from '@trezor/components';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';

interface PassphraseProps {
    isDeviceLocked: boolean;
}

export const Passphrase = ({ isDeviceLocked }: PassphraseProps) => {
    const dispatch = useDispatch();
    const { device } = useDevice();
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.Passphrase);

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

    return (
        <SectionItem
            data-test="@settings/device/passphrase"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_PASSPHRASE_TITLE" />}
                description={<Translation id="TR_DEVICE_SETTINGS_PASSPHRASE_DESC" />}
                buttonLink={HELP_CENTER_PASSPHRASE_URL}
            />
            <ActionColumn>
                <Switch
                    isChecked={passphraseProtection}
                    onChange={handleChange}
                    dataTest="@settings/device/passphrase-switch"
                    isDisabled={isDeviceLocked}
                />
            </ActionColumn>
        </SectionItem>
    );
};
