import { SettingsAnchor } from 'src/constants/suite/anchors';
import { SettingsSectionItem } from 'src/components/settings';
import { ActionButton, ActionColumn, TextColumn } from 'src/components/suite';
import { useDevice, useSelector } from 'src/hooks/suite';
import { openGithubIssue } from 'src/services/github';

export const GithubIssue = () => {
    const transport = useSelector(state => state.suite.transport);
    const { device } = useDevice();

    const handleClick = () => openGithubIssue({ device, transport });

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.GithubIssue}>
            <TextColumn
                title="Open issue on Github"
                description="Open issue on Github with pre-filled details. Do not use with sensitive data!"
            />
            <ActionColumn>
                <ActionButton variant="tertiary" onClick={handleClick}>
                    Open issue
                </ActionButton>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
