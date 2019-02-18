/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_AMOUNT: {
        id: 'TR_AMOUNT',
        defaultMessage: 'Amount',
    },
    TR_SET_MAX: {
        id: 'TR_SET_MAX',
        defaultMessage: 'Set max',
        description: 'Used for setting maximum amount in Send form',
    },
    TR_FEE: {
        id: 'TR_FEE',
        defaultMessage: 'Fee',
        description: 'Label in Send form',
    },
    TR_RECOMMENDED_FEES_UPDATED: {
        id: 'TR_RECOMMENDED_FEES_UPDATED',
        defaultMessage: 'Recommended fees updated.',
    },
    TR_CLICK_HERE_TO_USE_THEM: {
        id: 'TR_CLICK_HERE_TO_USE_THEM',
        defaultMessage: 'Click here to use them',
        description: 'Button to use recommended updated fees.',
    },
    TR_ADVANCED_SETTINGS: {
        id: 'TR_ADVANCED_SETTINGS',
        defaultMessage: 'Advanced settings',
        description: 'Shows advanced sending form',
    },
});

export default definedMessages;