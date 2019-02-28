/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_CHECK_ADDRESS_ON_TREZOR: {
        id: 'TR_CHECK_ADDRESS_ON_TREZOR',
        defaultMessage: 'Check address on Trezor',
    },
    TR_SHOW_FULL_ADDRESS: {
        id: 'TR_SHOW_FULL_ADDRESS',
        defaultMessage: 'Show full address',
    },
    TR_QR_CODE: {
        id: 'TR_QR_CODE',
        defaultMessage: 'QR Code',
    },
});

export default definedMessages;