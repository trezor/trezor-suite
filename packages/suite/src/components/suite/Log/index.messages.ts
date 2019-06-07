/* @flow */
import { defineMessages, Messages } from 'react-intl';

const definedMessages: Messages = defineMessages({
    TR_ATTENTION_COLON_THE_LOG_CONTAINS: {
        id: 'TR_ATTENTION_COLON_THE_LOG_CONTAINS',
        defaultMessage:
            'Attention: The log contains your XPUBs. Anyone with your XPUBs can see your account history.',
    },
    TR_LOG: {
        id: 'TR_LOG',
        defaultMessage: 'Log',
        description: 'application event and error',
    },
    TR_COPY_TO_CLIPBOARD: {
        id: 'TR_COPY_TO_CLIPBOARD',
        defaultMessage: 'Copy to clipboard',
    },
    TR_COPIED: {
        id: 'TR_COPIED',
        defaultMessage: 'Copied!',
    },
});

export default definedMessages;
