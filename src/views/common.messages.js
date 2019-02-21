/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_DEVICE_SETTINGS: {
        id: 'TR_DEVICE_SETTINGS',
        defaultMessage: 'Device settings',
    },
    TR_CLEAR: {
        id: 'TR_CLEAR',
        defaultMessage: 'Clear',
        description: 'Clear form button',
    },
    TR_CHECK_FOR_DEVICES: {
        id: 'TR_CHECK_FOR_DEVICES',
        defaultMessage: 'Check for devices',
    },
    TR_ADDRESS: {
        id: 'TR_ADDRESS',
        defaultMessage: 'Address',
        description: 'Used as label for receive/send address input',
    },
});

export default definedMessages;