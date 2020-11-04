import React from 'react';
import styled from 'styled-components';
import * as suiteActions from '@suite-actions/suiteActions';
import { Switch } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import { SectionItem, ActionColumn, TextColumn } from '@suite-components/Settings';
import { useActions, useSelector } from '@suite-hooks';

const PositionedSwitch = styled.div`
    align-self: flex-end;
`;

const Theme = () => {
    const theme = useSelector(state => state.suite.settings.theme);
    const { setTheme } = useActions({
        setTheme: suiteActions.setTheme,
    });
    const isDarkModeEnabled = theme.variant !== 'light'; // selected variant is dark or custom

    return (
        <SectionItem>
            <TextColumn
                title={<Translation id="TR_DARK_MODE" />}
                description={<Translation id="TR_DARK_MODE_DESCRIPTION" />}
            />
            <ActionColumn>
                <PositionedSwitch>
                    <Switch
                        checked={isDarkModeEnabled}
                        onChange={() => {
                            if (isDarkModeEnabled) {
                                setTheme('light');
                            } else {
                                setTheme('dark');
                            }
                        }}
                    />
                </PositionedSwitch>
            </ActionColumn>
        </SectionItem>
    );
};

export default Theme;
