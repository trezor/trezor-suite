import React from 'react';
import styled from 'styled-components';
import { Button, Switch, Select, THEME, SuiteThemeColors } from '@trezor/components';
import { SettingsLayout } from '@settings-components';
import { ActionColumn, Row, Section, TextColumn } from '@suite-components/Settings';
import * as suiteActions from '@suite-actions/suiteActions';
import { useSelector, useActions } from '@suite-hooks';

import { Props } from './Container';
import invityAPI from '@suite-services/invityAPI';

const StyledActionColumn = styled(ActionColumn)`
    max-width: 300px;
`;

const DebugSettings = (props: Props) => {
    const { setTheme } = useActions({
        setTheme: suiteActions.setTheme,
    });
    const invityAPIUrl = useSelector(state => state.suite.settings.debug.invityAPIUrl);
    const theme = useSelector(state => state.suite.settings.theme);
    const invityApiServerOptions = [
        {
            label: invityAPI.productionAPIServer,
            value: invityAPI.productionAPIServer,
        },
        {
            label: invityAPI.stagingAPIServer,
            value: invityAPI.stagingAPIServer,
        },
        {
            label: invityAPI.localhostAPIServer,
            value: invityAPI.localhostAPIServer,
        },
    ];
    const selectedInvityApiServer =
        invityApiServerOptions.find(s => s.value === invityAPIUrl) || invityApiServerOptions[0];
    return (
        <SettingsLayout>
            <Section title="Localization">
                <Row>
                    <TextColumn
                        title="Translation mode"
                        description="Translation mode enables distinctive visual styling for currently used intl messages. Helpful tooltip with an ID of the message will show up when you mouse over the message."
                    />
                    <ActionColumn>
                        <Switch
                            checked={props.debug.translationMode || false}
                            onChange={() => {
                                props.setDebugMode({
                                    translationMode: !props.debug.translationMode,
                                });
                            }}
                        />
                    </ActionColumn>
                </Row>
                <Row>
                    <TextColumn
                        title="Trezor Bridge dev mode (desktop)"
                        description="Starts Trezor Bridge on port 21324"
                    />
                    <ActionColumn>
                        <Switch
                            checked={props.debug.bridgeDevMode}
                            onChange={() => {
                                props.setDebugMode({
                                    bridgeDevMode: !props.debug.bridgeDevMode,
                                });
                            }}
                        />
                    </ActionColumn>
                </Row>
            </Section>
            <Section title="Invity">
                <Row>
                    <TextColumn
                        title="API server"
                        description="Set the server url for buy and exchange features"
                    />
                    <StyledActionColumn>
                        <Select
                            onChange={(item: { value: string; label: string }) => {
                                props.setDebugMode({
                                    invityAPIUrl: item.value,
                                });
                                invityAPI.setInvityAPIServer(item.value);
                            }}
                            value={selectedInvityApiServer}
                            options={invityApiServerOptions}
                        />
                    </StyledActionColumn>
                </Row>
            </Section>

            <Section title="Dark mode palette">
                <Row>
                    <TextColumn title="Reset palette" />
                    <ActionColumn>
                        <Button
                            onClick={() => {
                                setTheme('dark', undefined);
                            }}
                        >
                            Reset
                        </Button>
                    </ActionColumn>
                </Row>
                {Object.entries(THEME.dark).map(kv => {
                    const colorName = kv[0] as keyof SuiteThemeColors;
                    const defaultColorHex = kv[1];
                    return (
                        <Row>
                            {colorName}
                            <input
                                onChange={e => {
                                    const color = e.target.value;
                                    setTheme('custom', {
                                        ...THEME.dark,
                                        ...theme.colors,
                                        ...{ [colorName]: color },
                                    });
                                }}
                                type="color"
                                value={theme.colors?.[colorName] ?? defaultColorHex}
                            />
                        </Row>
                    );
                })}
            </Section>
        </SettingsLayout>
    );
};

export default DebugSettings;
