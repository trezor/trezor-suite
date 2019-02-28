/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_ENTERED_PIN_NOT_CORRECT: {
        id: 'TR_ENTERED_PIN_NOT_CORRECT',
        defaultMessage: 'Entered PIN for {deviceLabel} is not correct',
    },
    TR_RETRYING_DOT_DOT: {
        id: 'TR_RETRYING_DOT_DOT',
        defaultMessage: 'Retrying...',
    },
});

export default definedMessages;