import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { SettingsAnchor } from '@suite/router';
import { ActionButton, ActionColumn, TextColumn } from '@trezor/product-components';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { useDispatch } from 'src/hooks/suite';

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
                    intent="brand"
                    data-testid="@settings/show-log-button"
                >
                    <Translation id="TR_SHOW_LOG" />
                </ActionButton>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
