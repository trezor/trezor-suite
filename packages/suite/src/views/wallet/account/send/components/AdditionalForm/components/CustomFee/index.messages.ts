import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_CUSTOM_FEE_IS_NOT_SET: {
        id: 'TR_CUSTOM_FEE_IS_NOT_SET',
        defaultMessage: 'Fee is not set',
    },
    TR_CUSTOM_FEE_IS_NOT_VALID: {
        id: 'TR_CUSTOM_FEE_IS_NOT_NUMBER',
        defaultMessage: 'Fee is not a number',
    },
    TR_CUSTOM_FEE_NOT_IN_RANGE: {
        id: 'TR_CUSTOM_FEE_NOT_IN_RANGE',
        defaultMessage: 'Allowed fee is between {minFee} and {maxFee}',
    },
});

export default definedMessages;
