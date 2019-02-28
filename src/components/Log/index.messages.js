/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_ATTENTION_COLON_THE_LOG_CONTAINS: {
        id: 'TR_ATTENTION_COLON_THE_LOG_CONTAINS',
        defaultMessage: 'Attention: The log contains your XPUBs. Anyone with your XPUBs can see your account history.',
    },
    TR_LOG: {
        id: 'TR_LOG',
        defaultMessage: 'Log',
        description: 'application event and error',
    },
});

export default definedMessages;