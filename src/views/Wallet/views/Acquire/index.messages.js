/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_DEVICE_USED_IN_OTHER: {
        id: 'TR_DEVICE_USED_IN_OTHER',
        defaultMessage: 'Device is used in other window',
    },
    TR_USE_YOUR_DEVICE_IN_THIS_WINDOW: {
        id: 'TR_USE_YOUR_DEVICE_IN_THIS_WINDOW',
        defaultMessage: 'Do you want to use your device in this window?',
    },
    TR_ACQUIRE_DEVICE: {
        id: 'TR_ACQUIRE_DEVICE',
        defaultMessage: 'Acquire device',
        description: 'call-to-action to use device in current window when it is used in other window',
    },
});

export default definedMessages;