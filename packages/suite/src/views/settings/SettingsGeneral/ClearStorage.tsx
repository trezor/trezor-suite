import { Translation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import { ActionButton, ActionColumn, TextColumn } from '@trezor/product-components';

import { resetSuiteAppThunk } from 'src/actions/suite/suiteThunks';
import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
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
                    intent="brand"
                    data-testid="@settings/reset-app-button"
                >
                    <Translation id="TR_CLEAR_STORAGE" />
                </ActionButton>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
