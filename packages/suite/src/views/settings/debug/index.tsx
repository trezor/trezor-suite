import React, { useState, useEffect } from 'react';
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
import type { InvityServerEnvironment } from '@wallet-types/invity';
import { isTranslationMode, setTranslationMode } from '@suite-utils/l10n';
import { isWeb } from '@suite-utils/env';
import type { Await } from '@suite/types/utils';

type UserData = Extract<
    Await<ReturnType<NonNullable<typeof window['desktopApi']>['getUserDataInfo']>>,
    { success: true }
>;

const StyledActionSelect = styled(ActionSelect)`
    min-width: 260px;
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
    const invityApiServerOptions = Object.entries(invityAPI.servers).map(
        ([environment, server]) => ({
            label: server.api,
            value: environment as InvityServerEnvironment,
        }),
    );

    const selectedInvityApiServer =
        invityApiServerOptions.find(s => s.value === debug.invityServerEnvironment) ||
        invityApiServerOptions[0];
    const { device } = useDevice();

    const [userData, setUserData] = useState<UserData['payload'] | null>(null);

    useEffect(() => {
        if (isWeb()) {
            return;
        }
        const getUserDataInfo = async () => {
            const result = await window.desktopApi!.getUserDataInfo();
            if (result.success) {
                setUserData(result.payload);
            }
        };
        getUserDataInfo();
    }, []);

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
                {!isWeb() && (
                    <SectionItem>
                        <TextColumn
                            title="Wipe app data"
                            description={`Clicking this button restarts your application and wipes all your data including locally saved labels. ${
                                userData?.dir ? `Your local folder is: ${userData.dir}` : ''
                            }`}
                        />
                        <ActionColumn>
                            <ActionButton
                                variant="danger"
                                onClick={async () => {
                                    await window.desktopApi!.clearUserData();
                                    window.desktopApi!.appRestart();
                                }}
                            >
                                Wipe data
                            </ActionButton>
                        </ActionColumn>
                    </SectionItem>
                )}
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
                            onChange={(item: { value: InvityServerEnvironment; label: string }) => {
                                setDebugMode({
                                    invityServerEnvironment: item.value,
                                });
                                invityAPI.setInvityServersEnvironment(item.value);
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
