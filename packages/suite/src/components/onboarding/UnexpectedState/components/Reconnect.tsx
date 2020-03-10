import React from 'react';
import { Translation } from '@suite-components';
import { P } from '@trezor/components';
import { ConnectPrompt } from '@suite-components/Prompts';
import { Wrapper } from '@onboarding-components';
import messages from '@suite/support/messages';

const Reconnect = ({ model }: { model: number }) => (
    <Wrapper.Step>
        <Wrapper.StepHeading>
            <Translation {...messages.TR_RECONNECT_HEADER} />
        </Wrapper.StepHeading>
        <Wrapper.StepBody>
            <ConnectPrompt model={model} loop />
            <P>
                <Translation {...messages.TR_RECONNECT_TEXT} />
            </P>
            <P>---</P>
            <P>
                <Translation {...messages.TR_RECONNECT_TROUBLESHOOT_CONNECTION} />
            </P>
            <P>
                <Translation {...messages.TR_RECONNECT_TROUBLESHOOT_CABEL} />
            </P>
            <P>
                <Translation {...messages.TR_RECONNECT_TROUBLESHOOT_BRIDGE} />
            </P>
        </Wrapper.StepBody>
    </Wrapper.Step>
);

export default Reconnect;
