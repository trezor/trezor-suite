import React from 'react';
import { Translation } from '@suite-components/Intl';

import { P } from '@trezor/components';

import { ConnectPrompt } from '@suite-components/Prompts';
import { Wrapper } from '@onboarding-components';

import l10nMessages from './Reconnect.messages';

const Reconnect = ({ model }: { model: number }) => (
    <Wrapper.Step>
        <Wrapper.StepHeading>
            <Translation>{l10nMessages.TR_RECONNECT_HEADER}</Translation>
        </Wrapper.StepHeading>
        <Wrapper.StepBody>
            <ConnectPrompt model={model} loop />
            <P>
                <Translation>{l10nMessages.TR_RECONNECT_TEXT}</Translation>
            </P>
            <P>---</P>
            <P>
                <Translation>{l10nMessages.TR_RECONNECT_TROUBLESHOOT_CONNECTION}</Translation>
            </P>
            <P>
                <Translation>{l10nMessages.TR_RECONNECT_TROUBLESHOOT_CABEL}</Translation>
            </P>
            <P>
                <Translation> {l10nMessages.TR_RECONNECT_TROUBLESHOOT_BRIDGE}</Translation>
            </P>
        </Wrapper.StepBody>
    </Wrapper.Step>
);

export default Reconnect;
