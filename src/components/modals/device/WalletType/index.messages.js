/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_SELECT_WALLET_TYPE_FOR: {
        id: 'TR_SELECT_WALLET_TYPE_FOR',
        defaultMessage: 'Select wallet type for {deviceLabel}',
    },
    TR_CHANGE_WALLET_TYPE_FOR: {
        id: 'TR_CHANGE_WALLET_TYPE_FOR',
        defaultMessage: 'Select wallet type for {deviceLabel}',
    },
    TR_STANDARD_WALLET: {
        id: 'TR_STANDARD_WALLET',
        defaultMessage: 'Standard wallet',
    },
    TR_HIDDEN_WALLET: {
        id: 'TR_HIDDEN_WALLET',
        defaultMessage: 'Hidden wallet',
    },
    TR_CONTINUE_TO_ACCESS_STANDARD_WALLET: {
        id: 'TR_CONTINUE_TO_ACCESS_STANDARD_WALLET',
        defaultMessage: 'Continue to access your standard wallet.',
    },
    TR_PASSPHRASE_IS_OPTIONAL_FEATURE: {
        id: 'TR_PASSPHRASE_IS_OPTIONAL_FEATURE',
        defaultMessage: 'Passphrase is an optional feature of the Trezor device that is recommended for advanced users only. It is a word or a sentence of your choice. Its main purpose is to access a hidden wallet.',
    },
    TR_ASKED_ENTER_YOUR_PASSPHRASE_TO_UNLOCK: {
        id: 'TR_ASKED_ENTER_YOUR_PASSPHRASE_TO_UNLOCK',
        defaultMessage: 'You will be asked to enter your passphrase to unlock your hidden wallet.',
    },
});

export default definedMessages;