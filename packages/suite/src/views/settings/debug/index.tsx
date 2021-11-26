import React from 'react';
import styled from 'styled-components';
import { Switch, THEME, SuiteThemeColors } from '@trezor/components';
import { SettingsLayout } from '@settings-components';
import {
    ActionButton,
    ActionColumn,
    ActionSelect,
    Row,
    Section,
    SectionItem,
    TextColumn,
} from '@suite-components/Settings';
import * as suiteActions from '@suite-actions/suiteActions';
import { useDevice, useSelector, useActions } from '@suite-hooks';
import { openGithubIssue } from '@suite/services/github';
import invityAPI from '@suite-services/invityAPI';
import { isTranslationMode, setTranslationMode } from '@suite-utils/l10n';
import { isWeb } from '@suite-utils/env';

const StyledActionSelect = styled(ActionSelect)`
    min-width: 250px;
`;

const DebugSettings = () => {
    const { setTheme, setDebugMode } = useActions({
        setTheme: suiteActions.setTheme,
        setDebugMode: suiteActions.setDebugMode,
    });
    const { debug, theme } = useSelector(state => ({
        debug: state.suite.settings.debug,
        theme: state.suite.settings.theme,
    }));
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
        invityApiServerOptions.find(s => s.value === debug.invityAPIUrl) ||
        invityApiServerOptions[0];
    const { device } = useDevice();
    return (
        <SettingsLayout>
            {isWeb() && (
                <Section title="Localization">
                    <SectionItem>
                        <TextColumn
                            title="Translation mode"
                            description="Translation mode enables distinctive visual styling for currently used intl messages. Helpful tooltip with an ID of the message will show up when you mouse over the message."
                        />
                        <ActionColumn>
                            <Switch
                                checked={isTranslationMode()}
                                onChange={() => {
                                    setTranslationMode(!isTranslationMode());
                                }}
                            />
                        </ActionColumn>
                    </SectionItem>
                </Section>
            )}
            <Section title="Debug">
                <SectionItem>
                    <TextColumn
                        title="Trezor Bridge dev mode (desktop)"
                        description="Starts Trezor Bridge on port 21324"
                    />
                    <ActionColumn>
                        <Switch
                            checked={debug.bridgeDevMode}
                            onChange={() => {
                                setDebugMode({
                                    bridgeDevMode: !debug.bridgeDevMode,
                                });
                            }}
                        />
                    </ActionColumn>
                </SectionItem>
                <SectionItem>
                    <TextColumn
                        title="Open issue on Github"
                        description="Open issue on Github with pre-filled details. Do not use with sensitive data!"
                    />
                    <ActionColumn>
                        <ActionButton
                            onClick={() => {
                                openGithubIssue(device);
                            }}
                        >
                            Open issue
                        </ActionButton>
                    </ActionColumn>
                </SectionItem>
            </Section>
            <Section title="Invity">
                <SectionItem>
                    <TextColumn
                        title="API server"
                        description="Set the server url for buy and exchange features"
                    />
                    <ActionColumn>
                        <StyledActionSelect
                            noTopLabel
                            onChange={(item: { value: string; label: string }) => {
                                setDebugMode({
                                    invityAPIUrl: item.value,
                                });
                                invityAPI.setInvityAPIServer(item.value);
                            }}
                            value={selectedInvityApiServer}
                            options={invityApiServerOptions}
                        />
                    </ActionColumn>
                </SectionItem>
            </Section>

            <Section title="Dark mode palette">
                <SectionItem>
                    <TextColumn title="Reset palette" />
                    <ActionColumn>
                        <ActionButton
                            onClick={() => {
                                setTheme('dark', undefined);
                            }}
                        >
                            Reset
                        </ActionButton>
                    </ActionColumn>
                </SectionItem>
                {Object.entries(THEME.dark).map(kv => {
                    const colorName = kv[0] as keyof SuiteThemeColors;
                    const defaultColorHex = kv[1];
                    return (
                        <Row key={colorName}>
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
