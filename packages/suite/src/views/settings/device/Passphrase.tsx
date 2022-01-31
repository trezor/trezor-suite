import React from 'react';

import { Translation } from '@suite-components';
import { ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { Switch } from '@trezor/components';
import { useDevice, useAnalytics, useActions } from '@suite-hooks';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { PASSPHRASE_URL } from '@suite-constants/urls';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';

interface PassphraseProps {
    isDeviceLocked: boolean;
}

export const Passphrase = ({ isDeviceLocked }: PassphraseProps) => {
    const { device } = useDevice();
    const { applySettings } = useActions({
        applySettings: deviceSettingsActions.applySettings,
    });
    const analytics = useAnalytics();
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
                buttonLink={PASSPHRASE_URL}
            />
            <ActionColumn>
                <Switch
                    checked={passphraseProtection}
                    onChange={() => {
                        applySettings({
                            use_passphrase: !passphraseProtection,
                        });
                        analytics.report({
                            type: 'settings/device/change-passphrase-protection',
                            payload: {
                                use_passphrase: !passphraseProtection,
                            },
                        });
                    }}
                    data-test="@settings/device/passphrase-switch"
                    isDisabled={isDeviceLocked}
                />
            </ActionColumn>
        </SectionItem>
    );
};
