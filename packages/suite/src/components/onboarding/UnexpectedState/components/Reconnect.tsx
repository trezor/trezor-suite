import React from 'react';
import { Translation } from '@suite-components';
import { P } from '@trezor/components';
import { ConnectPrompt } from '@suite-components/Prompts';
import { Wrapper } from '@onboarding-components';

const Reconnect = ({ model }: { model: number }) => (
    <Wrapper.Step>
        <Wrapper.StepHeading>
            <Translation id="TR_RECONNECT_HEADER" />
        </Wrapper.StepHeading>
        <Wrapper.StepBody>
            <ConnectPrompt model={model} loop />
            <P>
                <Translation id="TR_RECONNECT_TEXT" />
            </P>
            <P>---</P>
            <P>
                <Translation id="TR_RECONNECT_TROUBLESHOOT_CONNECTION" />
            </P>
            <P>
                <Translation id="TR_RECONNECT_TROUBLESHOOT_CABEL" />
            </P>
            <P>
                <Translation id="TR_RECONNECT_TROUBLESHOOT_BRIDGE" />
            </P>
        </Wrapper.StepBody>
    </Wrapper.Step>
);

export default Reconnect;
