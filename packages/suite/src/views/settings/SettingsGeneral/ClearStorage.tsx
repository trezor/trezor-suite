import { resetSuiteAppThunk } from 'src/actions/suite/suiteThunks';
import { SettingsSectionItem } from 'src/components/settings';
import { ActionButton, ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDispatch } from 'src/hooks/suite';

export const ClearStorage = () => {
    const dispatch = useDispatch();

    const handleClick = async () => {
        await dispatch(resetSuiteAppThunk());
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.ClearStorage}>
            <TextColumn
                title={<Translation id="TR_SUITE_STORAGE" />}
                description={<Translation id="TR_CLEAR_STORAGE_DESCRIPTION" />}
            />
            <ActionColumn>
                <ActionButton
                    onClick={handleClick}
                    variant="primary"
                    data-testid="@settings/reset-app-button"
                >
                    <Translation id="TR_CLEAR_STORAGE" />
                </ActionButton>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
