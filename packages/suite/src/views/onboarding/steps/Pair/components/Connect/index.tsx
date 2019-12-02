import React from 'react';
import { Translation } from '@suite-components/Translation';
import { ConnectPrompt } from '@suite-components/Prompts';
import { Loaders, Text } from '@onboarding-components';

import l10nMessages from './index.messages';
import { AppState } from '@suite-types';

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
                    <Translation {...l10nMessages.TR_MAKE_SURE_IT_IS_WELL_CONNECTED} />{' '}
                    <Translation {...l10nMessages.TR_SEARCHING_FOR_YOUR_DEVICE} />
                    <Loaders.Dots />
                </Text>
            )}
        </>
    );
};

export default ConnectStep;
