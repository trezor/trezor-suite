/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_MENU: {
        id: 'TR_MENU',
        defaultMessage: 'Menu',
        description: 'Mobile sidebar toggler',
    },
    TR_MENU_CLOSE: {
        id: 'TR_MENU_CLOSE',
        defaultMessage: 'Close',
        description: 'Used on button for closing sidebar menu',
    },
    TR_TREZOR: {
        id: 'TR_TREZOR',
        defaultMessage: 'Trezor',
        description: 'Link in header navigation',
    },
    TR_WIKI: {
        id: 'TR_WIKI',
        defaultMessage: 'Wiki',
        description: 'Link in header navigation',
    },
    TR_BLOG: {
        id: 'TR_BLOG',
        defaultMessage: 'Blog',
        description: 'Link in header navigation',
    },
    TR_SUPPORT: {
        id: 'TR_SUPPORT',
        defaultMessage: 'Support',
        description: 'Link in header navigation',
    },
});

export default definedMessages;
