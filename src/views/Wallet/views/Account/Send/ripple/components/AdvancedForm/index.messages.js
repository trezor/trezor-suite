/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_XRP_TRANSFER_COST: {
        id: 'TR_XRP_TRANSFER_COST',
        defaultMessage: 'Transfer cost in XRP drops',
    },
    TR_XRP_DESTINATION_TAG: {
        id: 'TR_XRP_DESTINATION_TAG',
        defaultMessage: 'Destination tag',
    },
    TR_XRP_DESTINATION_TAG_EXPLAINED: {
        id: 'TR_XRP_DESTINATION_TAG_EXPLAINED',
        defaultMessage: 'Number that identifies a reason for payment or a non-Ripple account.',
    },
});

export default definedMessages;