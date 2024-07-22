import styled from 'styled-components';

import { Switch } from '@trezor/components';

import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { selectHasExperimentalFeature } from '../../../reducers/suite/suiteReducer';
import { isDesktop } from '@trezor/env-utils';
import { useSelector } from '../../../hooks/suite';
import { desktopApi } from '@trezor/suite-desktop-api';

const PositionedSwitch = styled.div`
    align-self: center;
`;

export const AutomaticUpdate = () => {
    const isExperimentalEnabled = useSelector(selectHasExperimentalFeature('automatic-update'));
    const isAutomaticUpdateEnabled = useSelector(
        state => state.desktopUpdate.isAutomaticUpdateEnabled,
    );

    if (!isDesktop() || !isExperimentalEnabled) {
        return null;
    }

    const handleChange = () => {
        const newValue = !isAutomaticUpdateEnabled;

        desktopApi.setAutomaticUpdateEnabled(newValue);
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.Analytics}>
            <TextColumn
                title={<Translation id="TR_ALLOW_AUTOMATIC_SUITE_UPDATES" />}
                description={<Translation id="TR_ALLOW_AUTOMATIC_SUITE_UPDATES_DESCRIPTION" />}
            />
            <ActionColumn>
                <PositionedSwitch>
                    <Switch
                        dataTest="@isAutomaticUpdateEnabled-update/toggle-switch"
                        isChecked={isAutomaticUpdateEnabled}
                        onChange={handleChange}
                    />
                </PositionedSwitch>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
