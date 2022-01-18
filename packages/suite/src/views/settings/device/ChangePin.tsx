import React from 'react';

import { Translation } from '@suite-components';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { useAnalytics, useActions } from '@suite-hooks';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';

interface ChangePinProps {
    isDeviceLocked: boolean;
}

export const ChangePin = ({ isDeviceLocked }: ChangePinProps) => {
    const analytics = useAnalytics();

    const { changePin } = useActions({
        changePin: deviceSettingsActions.changePin,
    });

    return (
        <SectionItem>
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_CHANGE_PIN_TITLE" />}
                description={<Translation id="TR_DEVICE_SETTINGS_CHANGE_PIN_DESC" />}
            />
            <ActionColumn>
                <ActionButton
                    onClick={() => {
                        changePin({ remove: false });
                        analytics.report({
                            type: 'settings/device/change-pin',
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
