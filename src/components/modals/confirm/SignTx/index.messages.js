/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_CONFIRM_TRANSACTION_ON: {
        id: 'TR_CONFIRM_TRANSACTION_ON',
        defaultMessage: 'Confirm transaction on {deviceLabel} device',
    },
    TR_DETAILS_ARE_SHOWN_ON: {
        id: 'TR_DETAILS_ARE_SHOWN_ON',
        defaultMessage: 'Details are shown on display',
    },
    TR_TO_LABEL: {
        id: 'TR_TO_LABEL',
        defaultMessage: 'To',
        description: 'Label for recepeint\'s address',
    },
    TR_SEND_LABEL: {
        id: 'TR_SEND_LABEL',
        defaultMessage: 'Send',
        description: 'Label for amount to be send',
    },
    TR_FEE_LABEL: {
        id: 'TR_FEE_LABEL',
        defaultMessage: 'Fee',
        description: 'Label above the fee used for transaction',
    },
});

export default definedMessages;