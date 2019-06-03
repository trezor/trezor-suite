import React from 'react';
import { FormattedMessage } from 'react-intl';
import { P } from '@trezor/components';

import { UnorderedList } from '@suite/components/onboarding/Lists';
// import { TrezorConnect } from '@suite/components/onboarding/Prompts';

import l10nMessages from './Reconnect.messages';
import { StepWrapper, StepHeadingWrapper, StepBodyWrapper } from '../Wrapper';

const items = [
    {
        component: (
            <P>
                <FormattedMessage {...l10nMessages.TR_RECONNECT_TROUBLESHOOT_CONNECTION} />
            </P>
        ),
        key: '1',
    },
    {
        component: (
            <P>
                <FormattedMessage {...l10nMessages.TR_RECONNECT_TROUBLESHOOT_CABEL} />
            </P>
        ),
        key: '2',
    },
    {
        component: (
            <P>
                <FormattedMessage {...l10nMessages.TR_RECONNECT_TROUBLESHOOT_BRIDGE} />
            </P>
        ),
        key: '3',
    },
];

const Reconnect = ({ model }: { model: number }) => (
    <StepWrapper>
        <StepHeadingWrapper>
            <FormattedMessage {...l10nMessages.TR_RECONNECT_HEADER} />
        </StepHeadingWrapper>
        <StepBodyWrapper>
            {/* <TrezorConnect model={model} loop /> */}
            <P>
                <FormattedMessage {...l10nMessages.TR_RECONNECT_TEXT} />
            </P>
            <UnorderedList items={items} />
        </StepBodyWrapper>
    </StepWrapper>
);

export default Reconnect;
