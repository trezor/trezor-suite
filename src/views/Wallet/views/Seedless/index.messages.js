/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_DEVICE_IS_INITIALIZED_IN_SEEDLESS_MODE: {
        id: 'TR_DEVICE_IS_INITIALIZED_IN_SEEDLESS_MODE',
        defaultMessage: 'Device is initialized in seedless mode and therefore not allowed to access wallet',
    },
    TR_DEVICE_IS_IN_SEEDLESS: {
        id: 'TR_DEVICE_IS_IN_SEEDLESS',
        defaultMessage: 'Device is in seedless mode',
    },
});

export default definedMessages;