import { ActionButton, ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDevice, useSelector } from 'src/hooks/suite';
import { openGithubIssue } from 'src/services/github';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';

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
