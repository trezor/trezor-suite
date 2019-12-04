import { Loaders, Text } from '@onboarding-components';
import { ConnectPrompt } from '@suite-components/Prompts';
import { Translation } from '@suite-components/Translation';
import { AppState } from '@suite-types';
import messages from '@suite/support/messages';
import React from 'react';

interface StepProps {
    model: AppState['onboarding']['selectedModel'];
    deviceIsConnected: boolean;
}

const ConnectStep = ({ model, deviceIsConnected }: StepProps) => {
    return (
        <>
            <ConnectPrompt model={model || 2} height={180} loop={!deviceIsConnected} />
            {!deviceIsConnected && (
                <Text>
                    <Translation {...messages.TR_MAKE_SURE_IT_IS_WELL_CONNECTED} />{' '}
                    <Translation {...messages.TR_SEARCHING_FOR_YOUR_DEVICE} />
                    <Loaders.Dots />
                </Text>
            )}
        </>
    );
};

export default ConnectStep;
