/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_ACCOUNT_HASH: {
        id: 'TR_ACCOUNT_HASH',
        defaultMessage: 'Account #{number}',
        description: 'Used in auto-generated account label',
    },
    TR_LOADING_DOT_DOT_DOT: {
        id: 'TR_LOADING_DOT_DOT_DOT',
        defaultMessage: 'Loading...',
    },
    TR_TO_ADD_A_NEW_ACCOUNT_LAST: {
        id: 'TR_TO_ADD_A_NEW_ACCOUNT_LAST',
        defaultMessage: 'To add a new account, last account must have some transactions.',
    },
    TR_TO_ADD_ACCOUNTS: {
        id: 'TR_TO_ADD_ACCOUNTS',
        defaultMessage: 'To add accounts, make sure your device is connected.',
    },
    TR_ADD_ACCOUNT: {
        id: 'TR_ADD_ACCOUNT',
        defaultMessage: 'Add account',
    },
});

export default definedMessages;