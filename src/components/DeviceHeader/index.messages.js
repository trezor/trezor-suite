/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype';

const definedMessages: Messages = defineMessages({
    TR_CONNECTED: {
        id: 'TR_CONNECTED',
        defaultMessage: 'Connected',
        description: 'Device status',
    },
    TR_CONNECTED_BOOTLOADER: {
        id: 'TR_CONNECTED_BOOTLOADER',
        defaultMessage: 'Connected (bootloader mode)',
        description: 'Device status',
    },
    TR_CONNECTED_NOT_INITIALIZED: {
        id: 'TR_CONNECTED',
        defaultMessage: 'Connected (not initialized)',
        description: 'Device status',
    },
    TR_CONNECTED_SEEDLESS: {
        id: 'TR_CONNECTED_SEEDLESS',
        defaultMessage: 'Connected (seedless mode)',
        description: 'Device status',
    },
    TR_CONNECTED_UPDATE_REQUIRED: {
        id: 'TR_CONNECTED_UPDATE_REQUIRED',
        defaultMessage: 'Connected (update required)',
        description: 'Device status',
    },
    TR_CONNECTED_UPDATE_RECOMMENDED: {
        id: 'TR_CONNECTED_UPDATE_RECOMMENDED',
        defaultMessage: 'Connected (update recommended)',
        description: 'Device status',
    },
    TR_USED_IN_ANOTHER_WINDOW: {
        id: 'TR_USED_IN_ANOTHER_WINDOW',
        defaultMessage: 'Used in other window',
        description: 'Device status',
    },
    TR_UNAVAILABLE: {
        id: 'TR_UNAVAILABLE',
        defaultMessage: 'Unavailable',
        description: 'Device status',
    },
    TR_UNREADABLE: {
        id: 'TR_UNREADABLE',
        defaultMessage: 'Unreadable',
        description: 'Device status',
    },
    TR_DISCONNECTED: {
        id: 'TR_DISCONNECTED',
        defaultMessage: 'Disconnected',
        description: 'Device status',
    },
    TR_STATUS_UNKNOWN: {
        id: 'TR_STATUS_UNKNOWN',
        defaultMessage: 'Status unknown',
        description: 'Device status',
    },
});

export default definedMessages;
