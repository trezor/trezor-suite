import { SettingsLayout } from '@settings-components';
import { ActionColumn, Row, Section, TextColumn } from '@suite-components/Settings';
import { Switch } from '@trezor/components';
import React from 'react';

import { Props } from './Container';

const DebugSettings = (props: Props) => {
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
                            checked={props.debug.translationMode}
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
                        title="Bridge dev mode (desktop)"
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
        </SettingsLayout>
    );
};

export default DebugSettings;
