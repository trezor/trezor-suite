/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_WOULD_YOU_LIKE_TREZOR_WALLET_TO: {
        id: 'TR_WOULD_YOU_LIKE_TREZOR_WALLET_TO',
        defaultMessage: 'Would you like Trezor Wallet to forget your {deviceCount, plural, one {device} other {devices}} or to remember {deviceCount, plural, one {it} other {them}}, so that it is still visible even while disconnected?',
    },
    TR_REMEMBER_DEVICE: {
        id: 'TR_REMEMBER_DEVICE',
        defaultMessage: 'Remember device',
    },
});

export default definedMessages;