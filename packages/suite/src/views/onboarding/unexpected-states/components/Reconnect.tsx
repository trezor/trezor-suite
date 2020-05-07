import React from 'react';
import { Translation } from '@suite-components';
import { ConnectPrompt } from '@suite-components/Prompts';
import { Wrapper, Text } from '@onboarding-components';

interface Props {
    model: number;
}

const Reconnect = ({ model }: Props) => (
    <Wrapper.Step data-test="@onboarding/unexpected-state/reconnect">
        <Wrapper.StepHeading>
            <Translation id="TR_RECONNECT_HEADER" />
        </Wrapper.StepHeading>
        <Wrapper.StepBody>
            <ConnectPrompt model={model} loop />
            <Text>
                <Translation id="TR_RECONNECT_TEXT" />
            </Text>
            <Text>---</Text>
            <Text>
                <Translation id="TR_RECONNECT_TROUBLESHOOT_CONNECTION" />
            </Text>
            <Text>
                <Translation id="TR_RECONNECT_TROUBLESHOOT_CABLE" />
            </Text>
            <Text>
                <Translation id="TR_RECONNECT_TROUBLESHOOT_BRIDGE" />
            </Text>
        </Wrapper.StepBody>
    </Wrapper.Step>
);

export default Reconnect;
