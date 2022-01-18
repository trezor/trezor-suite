import React from 'react';

import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { useDevice } from '@suite-hooks';
import { openGithubIssue } from '@suite/services/github';

export const GithubIssue = () => {
    const { device } = useDevice();

    return (
        <SectionItem>
            <TextColumn
                title="Open issue on Github"
                description="Open issue on Github with pre-filled details. Do not use with sensitive data!"
            />
            <ActionColumn>
                <ActionButton variant="secondary" onClick={() => openGithubIssue(device)}>
                    Open issue
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
