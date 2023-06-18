import React from 'react';

import * as modalActions from 'src/actions/suite/modalActions';
import { useActions } from 'src/hooks/suite';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from 'src/components/suite/Settings';
import { Translation } from 'src/components/suite';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';

export const ShowApplicationLog = () => {
    const { openModal } = useActions({
        openModal: modalActions.openModal,
    });
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.ShowLog);

    return (
        <SectionItem
            data-test="@settings/application-log"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title={<Translation id="TR_LOG" />}
                description={<Translation id="TR_LOG_DESCRIPTION" />}
            />
            <ActionColumn>
                <ActionButton
                    onClick={() => openModal({ type: 'application-log' })}
                    variant="secondary"
                    data-test="@settings/show-log-button"
                >
                    <Translation id="TR_SHOW_LOG" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
