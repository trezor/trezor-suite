import React from 'react';

import { openModal } from 'src/actions/suite/modalActions';
import { useDispatch } from 'src/hooks/suite';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from 'src/components/suite/Settings';
import { Translation } from 'src/components/suite';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';

export const ShowApplicationLog = () => {
    const dispatch = useDispatch();
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.ShowLog);

    const handleClick = () => dispatch(openModal({ type: 'application-log' }));

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
                    onClick={handleClick}
                    variant="secondary"
                    data-test="@settings/show-log-button"
                >
                    <Translation id="TR_SHOW_LOG" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
