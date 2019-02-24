/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_FORGET_LABEL: {
        id: 'TR_FORGET_LABEL',
        defaultMessage: 'Forget {deviceLabel}?',
    },
    TR_FORGET: {
        id: 'TR_FORGET',
        defaultMessage: 'Forget',
        description: 'Button in remember/forget dialog',
    },
});

export default definedMessages;