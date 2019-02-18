/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_UNVERIFIED_ADDRESS_COMMA_CONNECT: {
        id: 'TR_UNVERIFIED_ADDRESS_COMMA_CONNECT',
        defaultMessage: 'Unverified address, connect your Trezor to verify it',
    },
    TR_UNVERIFIED_ADDRESS_COMMA_SHOW: {
        id: 'TR_UNVERIFIED_ADDRESS_COMMA_SHOW',
        defaultMessage: 'Unverified address, show on Trezor.',
    },
    TR_SHOW_ON_TREZOR: {
        id: 'TR_SHOW_ON_TREZOR',
        defaultMessage: 'Show on Trezor',
    },
    TR_CONNECT_YOUR_TREZOR_TO_CHECK: {
        id: 'TR_CONNECT_YOUR_TREZOR_TO_CHECK',
        defaultMessage: 'Connect your Trezor to verify this address',
    },
});

export default definedMessages;