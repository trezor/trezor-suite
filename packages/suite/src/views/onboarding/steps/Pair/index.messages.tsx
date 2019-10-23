import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_FOUND_OK_DEVICE: {
        id: 'TR_FOUND_OK_DEVICE',
        defaultMessage: 'Found an empty device, yay! You can continue now.',
        description: 'Case when device was connected and it is in expected state (not initialized)',
    },
});

export default definedMessages;
