import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_XRP_DESTINATION_TAG: {
        id: 'TR_XRP_DESTINATION_TAG',
        defaultMessage: 'Destination tag',
    },
    TR_XRP_DESTINATION_TAG_EXPLAINED: {
        id: 'TR_XRP_DESTINATION_TAG_EXPLAINED',
        defaultMessage:
            'Destination tag is an arbitrary number which serves as a unique identifier of your transaction. Some services may require this to process your transaction.',
    },
    TR_DESTINATION_TAG_IS_NOT_SET: {
        id: 'TR_DESTINATION_TAG_IS_NOT_SET',
        defaultMessage: 'Destination tag is not set',
    },
    TR_DESTINATION_TAG_IS_NOT_NUMBER: {
        id: 'TR_DESTINATION_TAG_IS_NOT_NUMBER',
        defaultMessage: 'Destination tag is not a number',
    },
});

export default definedMessages;
