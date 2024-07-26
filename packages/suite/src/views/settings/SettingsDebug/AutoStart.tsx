import styled from 'styled-components';

import { Switch } from '@trezor/components';

import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { setAutoStart } from 'src/actions/suite/suiteActions';

const PositionedSwitch = styled.div`
    align-self: center;
`;

export const AutoStart = () => {
    const autoStartEnabled = useSelector(state => state.suite.settings.autoStart);
    const dispatch = useDispatch();

    const handleChange = () => {
        dispatch(setAutoStart(!autoStartEnabled));
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.AutoStart}>
            <TextColumn
                title={<Translation id="TR_AUTO_START" />}
                description={<Translation id="TR_AUTO_START_DESCRIPTION" />}
            />
            <ActionColumn>
                <PositionedSwitch>
                    <Switch
                        dataTest="@autostart/toggle-switch"
                        isChecked={!!autoStartEnabled}
                        onChange={handleChange}
                    />
                </PositionedSwitch>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
