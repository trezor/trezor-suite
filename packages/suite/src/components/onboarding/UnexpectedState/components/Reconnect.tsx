import React from 'react';
import { FormattedMessage } from 'react-intl';

import { P } from '@trezor/components';

import { ConnectPrompt } from '@suite-components/Prompts';
import { Wrapper } from '@onboarding-components';

import l10nMessages from './Reconnect.messages';

const Reconnect = ({ model }: { model: number }) => (
    <Wrapper.Step>
        <Wrapper.StepHeading>
            <FormattedMessage {...l10nMessages.TR_RECONNECT_HEADER} />
        </Wrapper.StepHeading>
        <Wrapper.StepBody>
            <ConnectPrompt model={model} loop />
            <P>
                <FormattedMessage {...l10nMessages.TR_RECONNECT_TEXT} />
            </P>
            <P>---</P>
            <P>
                <FormattedMessage {...l10nMessages.TR_RECONNECT_TROUBLESHOOT_CONNECTION} />
            </P>
            <P>
                <FormattedMessage {...l10nMessages.TR_RECONNECT_TROUBLESHOOT_CABEL} />
            </P>
            <P>
                <FormattedMessage {...l10nMessages.TR_RECONNECT_TROUBLESHOOT_BRIDGE} />
            </P>
        </Wrapper.StepBody>
    </Wrapper.Step>
);

export default Reconnect;
