import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_IS_NOT_NEW_DEVICE: {
        id: 'TR_IS_NOT_NEW_DEVICE',
        defaultMessage:
            'According to your decision in a previous step, this was supposed to be a fresh device. But we were able to detect already installed firmware on it.',
        description:
            'Just a message that we show after user selects that he wants to setup device as a new one but we detect that it apparently is not',
    },
});

export default definedMessages;
