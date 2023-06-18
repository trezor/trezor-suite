import React from 'react';
import { analytics, EventType } from '@trezor/suite-analytics';

import { Translation } from 'src/components/suite';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from 'src/components/suite/Settings';
import { useActions } from 'src/hooks/suite';
import * as deviceSettingsActions from 'src/actions/settings/deviceSettingsActions';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';

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
