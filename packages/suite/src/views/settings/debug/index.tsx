import React from 'react';
import styled from 'styled-components';
import { Button, Switch, Select, THEME, SuiteThemeColors } from '@trezor/components';
import { SettingsLayout } from '@settings-components';
import { ActionColumn, ActionSelect, Row, Section, TextColumn } from '@suite-components/Settings';
import * as suiteActions from '@suite-actions/suiteActions';
import * as languageActions from '@settings-actions/languageActions';
import { useDevice, useSelector, useActions } from '@suite-hooks';
import { openGithubIssue } from '@suite/services/github';
import { LANGUAGES } from '@suite-config';
import type { Locale } from '@suite-config/languages';
import invityAPI from '@suite-services/invityAPI';

const StyledActionColumn = styled(ActionColumn)`
    max-width: 300px;
`;

const DebugSettings = () => {
    const { setTheme, setDebugMode, fetchLocale } = useActions({
        setTheme: suiteActions.setTheme,
        setDebugMode: suiteActions.setDebugMode,
        fetchLocale: languageActions.fetchLocale,
    });
    const { debug, theme, language } = useSelector(state => ({
        debug: state.suite.settings.debug,
        theme: state.suite.settings.theme,
        language: state.suite.settings.language,
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
            <Section title="Localization">
                <Row>
                    <TextColumn
                        title="Translation mode"
                        description="Translation mode enables distinctive visual styling for currently used intl messages. Helpful tooltip with an ID of the message will show up when you mouse over the message."
                    />
                    <ActionColumn>
                        <Switch
                            checked={debug.translationMode || false}
                            onChange={() => {
                                setDebugMode({
                                    translationMode: !debug.translationMode,
                                });
                                if (debug.translationMode && !LANGUAGES[language].complete) {
                                    fetchLocale('en');
                                }
                            }}
                        />
                    </ActionColumn>
                </Row>
                <Row>
                    <TextColumn
                        title="Translation mode language"
                        description="Set target language for translation mode."
                    />
                    <StyledActionColumn>
                        <ActionSelect
                            hideTextCursor
                            useKeyPressScroll
                            noTopLabel
                            isDisabled={!debug.translationMode}
                            value={{
                                value: language,
                                label: LANGUAGES[language].name,
                            }}
                            options={Object.entries(LANGUAGES).map(([value, { name }]) => ({
                                value,
                                label: name,
                            }))}
                            onChange={(option: { value: Locale; label: string }) => {
                                fetchLocale(option.value);
                            }}
                        />
                    </StyledActionColumn>
                </Row>
            </Section>
            <Section title="Debug">
                <Row>
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
                </Row>
                <Row>
                    <TextColumn
                        title="Open issue on Github"
                        description="Open issue on Github with pre-filled details. Do not use with sensitive data!"
                    />
                    <ActionColumn>
                        <Button
                            onClick={() => {
                                openGithubIssue(device);
                            }}
                        >
                            Open issue
                        </Button>
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
                                setDebugMode({
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
