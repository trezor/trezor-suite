/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype';

const definedMessages: Messages = defineMessages({
    TR_SEND_ETHEREUM_OR_TOKENS: {
        id: 'TR_SEND_ETHEREUM_OR_TOKENS',
        defaultMessage: 'Send Ethereum or tokens',
    },
    YOU_HAVE_TOKEN_BALANCE: {
        id: 'YOU_HAVE_TOKEN_BALANCE',
        defaultMessage: 'You have: {tokenBalance}',
    },
    TR_HIGH_FEE: {
        id: 'TR_HIGH_FEE',
        defaultMessage: 'High',
        description: 'fee level',
    },
    TR_NORMAL_FEE: {
        id: 'TR_NORMAL_FEE',
        defaultMessage: 'Normal',
        description: 'fee level',
    },
    TR_LOW_FEE: {
        id: 'TR_LOW_FEE',
        defaultMessage: 'Low',
        description: 'fee level',
    },
    TR_CUSTOM_FEE: {
        id: 'TR_CUSTOM_FEE',
        defaultMessage: 'Custom',
        description: 'fee level',
    },
});

export default definedMessages;
