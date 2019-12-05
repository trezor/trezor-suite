import React from 'react';
import { Translation } from '@suite-components/Translation';
import { P } from '@trezor/components';
import { ConnectPrompt } from '@suite-components/Prompts';
import { Wrapper } from '@onboarding-components';
import messages from '@suite/support/messages';

const Reconnect = ({ model }: { model: number }) => (
    <Wrapper.Step>
        <Wrapper.StepHeading>
            <Translation>{messages.TR_RECONNECT_HEADER}</Translation>
        </Wrapper.StepHeading>
        <Wrapper.StepBody>
            <ConnectPrompt model={model} loop />
            <P>
                <Translation>{messages.TR_RECONNECT_TEXT}</Translation>
            </P>
            <P>---</P>
            <P>
                <Translation>{messages.TR_RECONNECT_TROUBLESHOOT_CONNECTION}</Translation>
            </P>
            <P>
                <Translation>{messages.TR_RECONNECT_TROUBLESHOOT_CABEL}</Translation>
            </P>
            <P>
                <Translation> {messages.TR_RECONNECT_TROUBLESHOOT_BRIDGE}</Translation>
            </P>
        </Wrapper.StepBody>
    </Wrapper.Step>
);

export default Reconnect;
