import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_NAV_TRANSACTIONS: {
        id: 'TR_NAV_TRANSACTIONS',
        defaultMessage: 'Transactions',
        description: 'Title of the navigation tab that contains tx history.',
    },
    TR_NAV_SUMMARY: {
        id: 'TR_NAV_SUMMARY',
        defaultMessage: 'Summary',
        description:
            'Title of the navigation tab that contains information about selected account (balance, tx history).',
    },
    TR_NAV_RECEIVE: {
        id: 'TR_NAV_RECEIVE',
        defaultMessage: 'Receive',
        description: 'Title of the navigation tab that contains the account address',
    },
    TR_NAV_SEND: {
        id: 'TR_NAV_SEND',
        defaultMessage: 'Send',
        description: 'Title of the navigation tab that contains a form for sending funds',
    },
    TR_NAV_SIGN_AND_VERIFY: {
        id: 'TR_NAV_SIGN_AND_VERIFY',
        defaultMessage: 'Sign & Verify',
        description:
            'Title of the navigation tab that contains a form for signing and verifying messages',
    },
});

export default definedMessages;
