import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_BTC: {
        id: 'TR_XRP_TRANSFER_COST',
        defaultMessage: 'Transfer cost in XRP drops',
    },
    TR_XRP_DESTINATION_TAG: {
        id: 'TR_XRP_DESTINATION_TAG',
        defaultMessage: 'Destination tag',
    },
    TR_XRP_DESTINATION_TAG_EXPLAINED: {
        id: 'TR_XRP_DESTINATION_TAG_EXPLAINED',
        defaultMessage:
            'Destination tag is an arbitrary number which serves as a unique identifier of your transaction. Some services may require this to process your transaction.',
    },
});

export default definedMessages;
