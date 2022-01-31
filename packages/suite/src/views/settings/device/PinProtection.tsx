import React from 'react';
import { Translation } from '@suite-components';
import { ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { Switch } from '@trezor/components';
import { useDevice, useAnalytics, useActions } from '@suite-hooks';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';

interface PinProtectionProps {
    isDeviceLocked: boolean;
}

export const PinProtection = ({ isDeviceLocked }: PinProtectionProps) => {
    const { device } = useDevice();
    const { changePin } = useActions({
        changePin: deviceSettingsActions.changePin,
    });
    const analytics = useAnalytics();
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.PinProtection);

    const pinProtection = device?.features?.pin_protection ?? null;
    return (
        <SectionItem
            data-test="@settings/device/pin-protection"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_PIN_PROTECTION_TITLE" />}
                description={<Translation id="TR_DEVICE_SETTINGS_PIN_PROTECTION_DESC" />}
            />
            <ActionColumn>
                <Switch
                    checked={!!pinProtection}
                    onChange={() => {
                        changePin({ remove: !!pinProtection });
                        analytics.report({
                            type: 'settings/device/change-pin-protection',
                            payload: {
                                remove: pinProtection,
                            },
                        });
                    }}
                    isDisabled={isDeviceLocked}
                    data-test="@settings/device/pin-switch"
                />
            </ActionColumn>
        </SectionItem>
    );
};
