import { SettingsSectionItem } from 'src/components/settings';
import { ActionButton, ActionColumn, TextColumn } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDevice, useSelector } from 'src/hooks/suite';
import { selectActiveTransports } from 'src/reducers/suite/suiteReducer';
import { openGithubIssue } from 'src/services/github';

export const GithubIssue = () => {
    const transports = useSelector(selectActiveTransports);
    const { device } = useDevice();

    const handleClick = () => openGithubIssue({ device, transports });

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.GithubIssue}>
            <TextColumn
                title="Open issue on Github"
                description="Open issue on Github with pre-filled details. Do not use with sensitive data!"
            />
            <ActionColumn>
                <ActionButton variant="primary" onClick={handleClick}>
                    Open issue
                </ActionButton>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
