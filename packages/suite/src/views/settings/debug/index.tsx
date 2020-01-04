import React from 'react';
import { H2, Switch } from '@trezor/components-v2';
import { SuiteLayout, SettingsMenu } from '@suite-components';

import { Props } from './Container';

import { Section, ActionColumn, Row, TextColumn } from '@suite-components/Settings';

const DebugSettings = (props: Props) => {
    return (
        <SuiteLayout title="Settings" secondaryMenu={<SettingsMenu />}>
            {/* todo: imho base padding should be in SuiteLayout, but it would break WalletLayout, so I have it temporarily here */}
            <div style={{ padding: '30px' }}>
                <H2>Debug Settings</H2>

                <Section header="Localization">
                    <Row>
                        <TextColumn
                            title={'Translation mode'}
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
                </Section>
            </div>
        </SuiteLayout>
    );
};

export default DebugSettings;
