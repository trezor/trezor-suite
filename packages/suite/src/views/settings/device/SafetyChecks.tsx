import React from 'react';
import { Translation } from 'src/components/suite';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from 'src/components/suite/Settings';
import { useActions } from 'src/hooks/suite';
import * as modalActions from 'src/actions/suite/modalActions';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';

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
