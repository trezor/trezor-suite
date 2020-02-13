import React from 'react';
<<<<<<< 0494e14d4caf8831fff0d560ef537ebceb932b34
import { Switch } from '@trezor/components';
import { SuiteLayout } from '@suite-components';
import { Menu as SettingsMenu } from '@settings-components';
=======
import { Switch } from '@trezor/components-v2';
import { SettingsLayout } from '@settings-components';
>>>>>>> introduce SettingsLayout, closes #1025

import { Props } from './Container';

import { Section, ActionColumn, Row, TextColumn } from '@suite-components/Settings';

const DebugSettings = (props: Props) => {
    return (
        <SettingsLayout>
            <Section header="Localization">
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
            </Section>
        </SettingsLayout>
    );
};

export default DebugSettings;
