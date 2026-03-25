import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import { Switch } from '@trezor/components';
import { ActionColumn, TextColumn } from '@trezor/product-components';
import { desktopApi } from '@trezor/suite-desktop-api';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { selectDesktopUpdateEnabled } from 'src/reducers/suite/desktopUpdateReducer';

import { useSelector } from '../../../hooks/suite';

const PositionedSwitch = styled.div`
    align-self: center;
`;

export const AutomaticUpdate = () => {
    const isUpdateEnabled = useSelector(selectDesktopUpdateEnabled);
    const isAutomaticUpdateEnabled = useSelector(
        state => state.desktopUpdate.isAutomaticUpdateEnabled,
    );

    if (!isUpdateEnabled) {
        return null;
    }

    const handleChange = () => {
        const newValue = !isAutomaticUpdateEnabled;

        desktopApi.setAutomaticUpdateEnabled(newValue);
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.AutomaticUpdate}>
            <TextColumn
                title={<Translation id="TR_ALLOW_AUTOMATIC_SUITE_UPDATES" />}
                description={<Translation id="TR_ALLOW_AUTOMATIC_SUITE_UPDATES_DESCRIPTION" />}
            />
            <ActionColumn>
                <PositionedSwitch>
                    <Switch
                        data-testid="@isAutomaticUpdateEnabled-update/toggle-switch"
                        isChecked={isAutomaticUpdateEnabled}
                        onChange={handleChange}
                    />
                </PositionedSwitch>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
