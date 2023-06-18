import React from 'react';
import { analytics, EventType } from '@trezor/suite-analytics';

import { Translation } from 'src/components/suite';
import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite/Settings';
import { Switch } from '@trezor/components';
import { useDevice, useActions } from 'src/hooks/suite';
import * as deviceSettingsActions from 'src/actions/settings/deviceSettingsActions';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';

interface PinProtectionProps {
    isDeviceLocked: boolean;
}

export const PinProtection = ({ isDeviceLocked }: PinProtectionProps) => {
    const { device } = useDevice();
    const { changePin } = useActions({
        changePin: deviceSettingsActions.changePin,
    });
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
                    isChecked={!!pinProtection}
                    onChange={() => {
                        changePin({ remove: !!pinProtection });
                        analytics.report({
                            type: EventType.SettingsDeviceChangePinProtection,
                            payload: {
                                remove: pinProtection,
                            },
                        });
                    }}
                    isDisabled={isDeviceLocked}
                    dataTest="@settings/device/pin-switch"
                />
            </ActionColumn>
        </SectionItem>
    );
};
