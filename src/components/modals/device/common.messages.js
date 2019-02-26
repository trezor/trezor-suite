/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_FORGET_LABEL: {
        id: 'TR_FORGET_LABEL',
        defaultMessage: 'Forget {deviceLabel}?',
    },
    TR_FORGET_DEVICE: {
        id: 'TR_FORGET_DEVICE',
        defaultMessage: 'Forget device',
        description: 'Button in remember/forget dialog',
    },
});

export default definedMessages;