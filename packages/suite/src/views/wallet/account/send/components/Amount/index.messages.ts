import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_AMOUNT: {
        id: 'TR_AMOUNT',
        defaultMessage: 'Amount',
    },
    TR_SET_MAX: {
        id: 'TR_SET_MAX',
        defaultMessage: 'Set max',
        description: 'Used for setting maximum amount in Send form',
    },
    TR_AMOUNT_IS_NOT_SET: {
        id: 'TR_ADDRESS_IS_NOT_SET',
        defaultMessage: 'Amount is not set',
    },
    TR_AMOUNT_IS_NOT_NUMBER: {
        id: 'TR_ADDRESS_IS_NOT_NUMBER',
        defaultMessage: 'Amount is not a number',
    },
});

export default definedMessages;
