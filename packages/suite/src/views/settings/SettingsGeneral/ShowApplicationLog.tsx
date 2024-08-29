import { openModal } from 'src/actions/suite/modalActions';
import { useDispatch } from 'src/hooks/suite';

import { SettingsSectionItem } from 'src/components/settings';
import { ActionButton, ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';

export const ShowApplicationLog = () => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(openModal({ type: 'application-log' }));

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.ShowLog}>
            <TextColumn
                title={<Translation id="TR_LOG" />}
                description={<Translation id="TR_LOG_DESCRIPTION" />}
            />
            <ActionColumn>
                <ActionButton
                    onClick={handleClick}
                    variant="tertiary"
                    data-testid="@settings/show-log-button"
                >
                    <Translation id="TR_SHOW_LOG" />
                </ActionButton>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
