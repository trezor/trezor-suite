import React from 'react';

import * as modalActions from '@suite-actions/modalActions';
import { useActions } from '@suite-hooks';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { Translation } from '@suite-components';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';

export const ShowLog = () => {
    const { openModal } = useActions({
        openModal: modalActions.openModal,
    });
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.ShowLog);

    return (
        <SectionItem data-test="@settings/log" ref={anchorRef} shouldHighlight={shouldHighlight}>
            <TextColumn
                title={<Translation id="TR_LOG" />}
                description={<Translation id="TR_LOG_DESCRIPTION" />}
            />
            <ActionColumn>
                <ActionButton
                    onClick={() => openModal({ type: 'log' })}
                    variant="secondary"
                    data-test="@settings/show-log-button"
                >
                    <Translation id="TR_SHOW_LOG" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
