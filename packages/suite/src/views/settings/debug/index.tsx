import { SettingsLayout } from '@settings-components';
import { ActionColumn, Row, Section, TextColumn } from '@suite-components/Settings';
import { Switch, Select } from '@trezor/components';
import styled from 'styled-components';
import InvityAPI from '@suite/services/invityAPI';
import React from 'react';

import { Props } from './Container';

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
            </Section>
            <Section title="Invity">
                <Row>
                    <TextColumn
                        title="API server"
                        description="Set the server url for buy and exchange features"
                    />
                    <StyledActionColumn>
                        <Select
                            onChange={(item: { value: string; label: string }) =>
                                props.setDebugMode({
                                    invityAPIUrl: item.value,
                                })
                            }
                            value={{
                                label: props.debug.invityAPIUrl,
                                value: props.debug.invityAPIUrl,
                            }}
                            options={[
                                {
                                    label: InvityAPI.localhostAPIServer,
                                    value: InvityAPI.localhostAPIServer,
                                },
                                {
                                    label: InvityAPI.stagingAPIServer,
                                    value: InvityAPI.stagingAPIServer,
                                },
                                {
                                    label: InvityAPI.productionAPIServer,
                                    value: InvityAPI.productionAPIServer,
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
