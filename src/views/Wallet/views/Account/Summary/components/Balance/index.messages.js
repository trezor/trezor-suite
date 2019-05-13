/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype';

const definedMessages: Messages = defineMessages({
    TR_BALANCE: {
        id: 'TR_BALANCE',
        defaultMessage: 'Balance',
    },
    TR_RATE: {
        id: 'TR_RATE',
        defaultMessage: 'Rate',
    },
    TR_RESERVE: {
        id: 'TR_RESERVE',
        defaultMessage: 'Reserve',
        description: 'Label for minimal XRP account reserve',
    },
    TR_FIAT_RATES_ARE_NOT_CURRENTLY: {
        id: 'TR_FIAT_RATES_ARE_NOT_CURRENTLY',
        defaultMessage: 'Fiat rates are not currently available.',
    },
});

export default definedMessages;
