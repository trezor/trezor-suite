/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_CONFIRM_ADDRESS_ON_TREZOR: {
        id: 'TR_CONFIRM_ADDRESS_ON_TREZOR',
        defaultMessage: 'Confirm address on Trezor',
    },
    TR_PLEASE_COMPARE_YOUR_ADDRESS: {
        id: 'TR_PLEASE_COMPARE_YOUR_ADDRESS',
        defaultMessage: 'Please compare your address on device with address shown bellow',
    },
});

export default definedMessages;