import React from 'react';

import * as modalActions from '@suite-actions/modalActions';
import { useActions } from '@suite-hooks';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { Translation } from '@suite-components';

export const ShowLog = () => {
    const { openModal } = useActions({
        openModal: modalActions.openModal,
    });

    return (
        <SectionItem data-test="@settings/log">
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
