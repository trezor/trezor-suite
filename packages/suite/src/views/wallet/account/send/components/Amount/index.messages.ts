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
        id: 'TR_AMOUNT_IS_NOT_SET',
        defaultMessage: 'Amount is not set',
    },
    TR_AMOUNT_IS_NOT_NUMBER: {
        id: 'TR_AMOUNT_IS_NOT_NUMBER',
        defaultMessage: 'Amount is not a number',
    },
    TR_AMOUNT_IS_NOT_ENOUGH: {
        id: 'TR_AMOUNT_IS_NOT_ENOUGH',
        defaultMessage: 'Not enough funds',
    },
    TR_AMOUNT_IS_NOT_IN_RANGE_DECIMALS: {
        id: 'TR_AMOUNT_IS_NOT_IN_RANGE_DECIMALS',
        defaultMessage: 'Maximum {decimals} decimals allowed',
    },
});

export default definedMessages;
