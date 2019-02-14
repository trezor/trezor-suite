/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_YOU_ARE_OPENING_TREZOR_BETA_WALLET: {
        id: 'TR_YOU_ARE_OPENING_TREZOR_BETA_WALLET',
        defaultMessage: 'You are opening Trezor Beta Wallet',
    },
    TR_TREZOR_BETA_WALLET_IS: {
        id: 'TR_TREZOR_BETA_WALLET_IS',
        defaultMessage: '{trezorBetaWallet} is a public feature-testing version of the {trezorWallet}, offering the newest features before they are available to the general public.',
    },
    TR_IN_CONTRAST_COMMA_TREZOR: {
        id: 'TR_IN_CONTRAST_COMMA_TREZOR',
        defaultMessage: 'In contrast, {trezorWallet} is feature-conservative, making sure that its functionality is maximally reliable and dependable for the general public.',
    },
    TR_PLEASE_NOTE_THAT_THE_TREZOR: {
        id: 'TR_PLEASE_NOTE_THAT_THE_TREZOR',
        defaultMessage: 'Please note that the {trezorBetaWallet} might be collecting anonymized usage data, especially error logs, for development purposes. The {trezorWallet} does not log any data.',
    },
    TR_OK_COMMA_I_UNDERSTAND: {
        id: 'TR_OK_COMMA_I_UNDERSTAND',
        defaultMessage: 'OK, I understand',
    },
    TR_TREZOR_WALLET: {
        id: 'TR_TREZOR_WALLET',
        defaultMessage: 'Trezor Wallet',
    },
    TR_TREZOR_BETA_WALLET: {
        id: 'TR_TREZOR_BETA_WALLET',
        defaultMessage: 'Trezor Beta Wallet',
    },
});

export default definedMessages;