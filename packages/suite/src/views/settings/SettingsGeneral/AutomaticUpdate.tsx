import styled from 'styled-components';

import { Switch } from '@trezor/components';

import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { isDesktop } from '@trezor/env-utils';
import { useSelector } from '../../../hooks/suite';
import { desktopApi } from '@trezor/suite-desktop-api';

const PositionedSwitch = styled.div`
    align-self: center;
`;

export const AutomaticUpdate = () => {
    const isAutomaticUpdateEnabled = useSelector(
        state => state.desktopUpdate.isAutomaticUpdateEnabled,
    );

    if (!isDesktop()) {
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
