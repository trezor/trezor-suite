import React from 'react';
import { HELP_CENTER_PASSPHRASE_URL } from '@trezor/urls';
import { analytics, EventType } from '@trezor/suite-analytics';

import { Translation } from 'src/components/suite';
import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite/Settings';
import { Switch } from '@trezor/components';
import { useDevice, useActions } from 'src/hooks/suite';
import * as deviceSettingsActions from 'src/actions/settings/deviceSettingsActions';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';

interface PassphraseProps {
    isDeviceLocked: boolean;
}

export const Passphrase = ({ isDeviceLocked }: PassphraseProps) => {
    const { device } = useDevice();
    const { applySettings } = useActions({
        applySettings: deviceSettingsActions.applySettings,
    });
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.Passphrase);

    const passphraseProtection = !!device?.features?.passphrase_protection;
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
                    onChange={() => {
                        applySettings({
                            use_passphrase: !passphraseProtection,
                        });
                        analytics.report({
                            type: EventType.SettingsDeviceChangePassphraseProtection,
                            payload: {
                                use_passphrase: !passphraseProtection,
                            },
                        });
                    }}
                    dataTest="@settings/device/passphrase-switch"
                    isDisabled={isDeviceLocked}
                />
            </ActionColumn>
        </SectionItem>
    );
};
