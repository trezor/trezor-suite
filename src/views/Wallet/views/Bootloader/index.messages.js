/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_YOUR_DEVICE_IS_IN_FIRMWARE: {
        id: 'TR_YOUR_DEVICE_IS_IN_FIRMWARE',
        defaultMessage: 'Your device is in firmware update mode',
    },
    TR_PLEASE_RECONNECT_IT: {
        id: 'TR_PLEASE_RECONNECT_IT',
        defaultMessage: 'Please re-connect it',
        description: 'Call to action to re-connect Trezor device',
    },
});

export default definedMessages;