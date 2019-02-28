/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_YOUR_DEVICE_IS_NOT_INITIALIZED: {
        id: 'TR_YOUR_DEVICE_IS_NOT_INITIALIZED',
        defaultMessage: 'Your device is not initialized',
    },
    TR_PLEASE_USE_TO_START_INITIALIZATION: {
        id: 'TR_PLEASE_USE_TO_START_INITIALIZATION',
        defaultMessage: 'Please use Bitcoin wallet interface to start initialization process',
    },
});

export default definedMessages;