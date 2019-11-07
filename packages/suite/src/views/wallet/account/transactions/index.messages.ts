import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_TRANSACTIONS: {
        id: 'TR_TRANSACTIONS',
        defaultMessage: '{network} Transactions',
    },
    TR_TRANSACTIONS_AND_TOKENS: {
        id: 'TR_TRANSACTIONS_AND_TOKENS',
        defaultMessage: '{network} and tokens transactions',
    },
    TR_LOADING_TRANSACTIONS: {
        id: 'TR_LOADING_TRANSACTIONS',
        defaultMessage: 'Loading transactions',
    },
    TR_NO_TRANSACTIONS: {
        id: 'TR_NO_TRANSACTIONS',
        defaultMessage: 'No Transactions :(',
    },
    TR_UNKNOWN_TRANSACTION: {
        id: 'TR_UNKNOWN_TRANSACTION',
        defaultMessage: '(Unknown transaction)',
    },
    TR_SENT_TO_SELF: {
        id: 'TR_SENT_TO_SELF',
        defaultMessage: '(Sent to self)',
    },
    TR_PENDING: {
        id: 'TR_PENDING',
        defaultMessage: 'Pending',
        description: 'Pending transaction with no confirmations',
    },
});

export default definedMessages;
