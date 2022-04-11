import React from 'react';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { useDevice, useSelector } from '@suite-hooks';
import { openGithubIssue } from '@suite/services/github';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';

export const GithubIssue = () => {
    const transport = useSelector(state => state.suite.transport);
    const { device } = useDevice();
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.GithubIssue);

    return (
        <SectionItem
            data-test="@settings/debug/github"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title="Open issue on Github"
                description="Open issue on Github with pre-filled details. Do not use with sensitive data!"
            />
            <ActionColumn>
                <ActionButton
                    variant="secondary"
                    onClick={() => openGithubIssue({ device, transport })}
                >
                    Open issue
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
