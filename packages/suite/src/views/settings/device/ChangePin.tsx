import React from 'react';
import { analytics, EventType } from '@trezor/suite-analytics';

import { Translation } from '@suite-components';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { useActions } from '@suite-hooks';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';

interface ChangePinProps {
    isDeviceLocked: boolean;
}

export const ChangePin = ({ isDeviceLocked }: ChangePinProps) => {
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.ChangePin);

    const { changePin } = useActions({
        changePin: deviceSettingsActions.changePin,
    });

    return (
        <SectionItem
            data-test="@settings/device/change-pin"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_CHANGE_PIN_TITLE" />}
                description={<Translation id="TR_DEVICE_SETTINGS_CHANGE_PIN_DESC" />}
            />
            <ActionColumn>
                <ActionButton
                    onClick={() => {
                        changePin({ remove: false });
                        analytics.report({
                            type: EventType.SettingsDeviceChangePin,
                        });
                    }}
                    isDisabled={isDeviceLocked}
                    variant="secondary"
                >
                    <Translation id="TR_CHANGE_PIN" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
