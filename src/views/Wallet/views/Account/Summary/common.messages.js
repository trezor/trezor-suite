/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_SEE_FULL_TRANSACTION_HISTORY: {
        id: 'TR_SEE_FULL_TRANSACTION_HISTORY',
        defaultMessage: 'See full transaction history',
    },
    TR_TOKENS: {
        id: 'TR_TOKENS',
        defaultMessage: 'Tokens',
    },
    TR_INSERT_TOKEN_NAME: {
        id: 'TR_INSERT_TOKEN_NAME',
        defaultMessage: 'Insert token name, symbol or address to be able to send it.',
    },
    TR_TYPE_IN_A_TOKEN_NAME: {
        id: 'TR_TYPE_IN_A_TOKEN_NAME',
        defaultMessage: 'Type in a token name or a token address.',
    },
    TR_TOKEN_NOT_FOUND: {
        id: 'TR_TOKEN_NOT_FOUND',
        defaultMessage: 'Token not found',
    },
    TR_ALREADY_USED: {
        id: 'TR_ALREADY_USED',
        defaultMessage: 'Already used',
    },
    TR_HISTORY: {
        id: 'TR_HISTORY',
        defaultMessage: 'History',
    },
});

export default definedMessages;