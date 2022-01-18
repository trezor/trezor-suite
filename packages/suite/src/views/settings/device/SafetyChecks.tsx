import React from 'react';
import { Translation } from '@suite-components';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { useActions } from '@suite-hooks';
import * as modalActions from '@suite-actions/modalActions';

interface SafetyChecksProps {
    isDeviceLocked: boolean;
}

export const SafetyChecks = ({ isDeviceLocked }: SafetyChecksProps) => {
    const { openModal } = useActions({
        openModal: modalActions.openModal,
    });

    return (
        <SectionItem>
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_SAFETY_CHECKS_TITLE" />}
                description={<Translation id="TR_DEVICE_SETTINGS_SAFETY_CHECKS_DESC" />}
            />
            <ActionColumn>
                <ActionButton
                    variant="secondary"
                    onClick={() => {
                        openModal({ type: 'safety-checks' });
                    }}
                    data-test="@settings/device/safety-checks-button"
                    isDisabled={isDeviceLocked}
                >
                    <Translation id="TR_DEVICE_SETTINGS_SAFETY_CHECKS_BUTTON" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
