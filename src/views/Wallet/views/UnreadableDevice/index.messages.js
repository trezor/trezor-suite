/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_UNREADABLE_DEVICE: {
        id: 'TR_UNREADABLE_DEVICE',
        defaultMessage: 'Unreadable device',
    },
    TR_PLEASE_INSTALL_TREZOR_BRIDGE: {
        id: 'TR_PLEASE_INSTALL_TREZOR_BRIDGE',
        defaultMessage: 'Please install Trezor Bridge',
    },
});

export default definedMessages;