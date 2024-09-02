import { desktopApi } from '@trezor/suite-desktop-api';

import { SettingsSectionItem } from 'src/components/settings';
import { ActionButton, ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { removeDatabase } from 'src/actions/suite/storageActions';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { reloadApp } from 'src/utils/suite/reload';

export const ClearStorage = () => {
    const dispatch = useDispatch();

    const handleClick = async () => {
        localStorage.clear();
        dispatch(removeDatabase());
        if (desktopApi.available) {
            // Reset the desktop-specific store.
            desktopApi.clearStore();
        } else {
            // redirect to / and reload the web
            await dispatch(goto('suite-index'));
        }
        reloadApp();
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
