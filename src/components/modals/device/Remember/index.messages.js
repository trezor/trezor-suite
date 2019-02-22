/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_FORGET_LABEL: {
        id: 'TR_FORGET_LABEL',
        defaultMessage: 'Forget {deviceLabel}?',
    },
    TR_WOULD_YOU_LIKE_TREZOR_WALLET_TO: {
        id: 'TR_WOULD_YOU_LIKE_TREZOR_WALLET_TO',
        defaultMessage: 'Would you like Trezor Wallet to forget your {deviceCount, plural, one {device} other {devices}} or to remember {deviceCount, plural, one {it} other {them}}, so that it is still visible even while disconnected?',
    },
    TR_FORGET: {
        id: 'TR_FORGET',
        defaultMessage: 'Forget',
    },
    TR_REMEMBER: {
        id: 'TR_REMEMBER',
        defaultMessage: 'Remember',
    },
});

export default definedMessages;