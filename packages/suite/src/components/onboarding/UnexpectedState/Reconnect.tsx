import React from 'react';
import { FormattedMessage } from 'react-intl';
import { P } from '@trezor/components';

import { TrezorConnect } from '@suite/components/onboarding/Prompts';

import l10nMessages from './Reconnect.messages';
import { StepWrapper, StepHeadingWrapper, StepBodyWrapper } from '../Wrapper';

const Reconnect = ({ model }: { model: number }) => (
    <StepWrapper>
        <StepHeadingWrapper>
            <FormattedMessage {...l10nMessages.TR_RECONNECT_HEADER} />
        </StepHeadingWrapper>
        <StepBodyWrapper>
            <TrezorConnect model={model} loop />
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
        </StepBodyWrapper>
    </StepWrapper>
);

export default Reconnect;
