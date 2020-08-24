import { SettingsLayout } from '@settings-components';
import { ActionColumn, Row, Section, TextColumn } from '@suite-components/Settings';
import { Switch, Select } from '@trezor/components';
import styled from 'styled-components';
import React from 'react';

import { Props } from './Container';
import invityAPI from '@suite/services/invityAPI';

const StyledActionColumn = styled(ActionColumn)`
    max-width: 300px;
`;

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
                            value={{
                                label: props.debug.invityAPIUrl,
                                value: props.debug.invityAPIUrl,
                            }}
                            options={[
                                {
                                    label: invityAPI.localhostAPIServer,
                                    value: invityAPI.localhostAPIServer,
                                },
                                {
                                    label: invityAPI.stagingAPIServer,
                                    value: invityAPI.stagingAPIServer,
                                },
                                {
                                    label: invityAPI.productionAPIServer,
                                    value: invityAPI.productionAPIServer,
                                },
                            ]}
                        />
                    </StyledActionColumn>
                </Row>
            </Section>
        </SettingsLayout>
    );
};

export default DebugSettings;
