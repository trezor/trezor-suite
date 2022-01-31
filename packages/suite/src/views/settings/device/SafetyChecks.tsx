import React from 'react';
import { Translation } from '@suite-components';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { useActions } from '@suite-hooks';
import * as modalActions from '@suite-actions/modalActions';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';

interface SafetyChecksProps {
    isDeviceLocked: boolean;
}

export const SafetyChecks = ({ isDeviceLocked }: SafetyChecksProps) => {
    const { openModal } = useActions({
        openModal: modalActions.openModal,
    });
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.SafetyChecks);

    return (
        <SectionItem
            data-test="@settings/device/safety-checks"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
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
