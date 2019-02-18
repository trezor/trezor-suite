/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_TREZOR_WALLET_IS_AN_EASY_DASH: {
        id: 'TR_TREZOR_WALLET_IS_AN_EASY_DASH',
        defaultMessage: 'Trezor Wallet is an easy-to-use interface for your Trezor. Trezor Wallet allows you to easily control your funds, manage your balance and initiate transfers.',
    },
    TR_THE_PRIVATE_BANK_IN_YOUR_HANDS: {
        id: 'TR_THE_PRIVATE_BANK_IN_YOUR_HANDS',
        defaultMessage: 'The private bank in your hands.',
    },
    TR_CONNECT_TREZOR_TO_CONTINUE: {
        id: 'TR_CONNECT_TREZOR_TO_CONTINUE',
        defaultMessage: 'Connect Trezor to continue',
    },
    TR_AND: {
        id: 'TR_AND',
        defaultMessage: 'and',
    },
    TR_DEVICE_NOT_RECOGNIZED_TRY_INSTALLING: {
        id: 'TR_DEVICE_NOT_RECOGNIZED_TRY_INSTALLING',
        defaultMessage: 'Device not recognized? Try installing the {link}.',
    },
    TR_DONT_HAVE_A_TREZOR: {
        id: 'TR_DONT_HAVE_A_TREZOR_GET',
        defaultMessage: 'Don\'t have a Trezor? {getOne}',
    },
    TR_GET_ONE: {
        id: 'TR_GET_ONE',
        description: 'Part of the sentence: Dont have a Trezor? Get one',
        defaultMessage: 'Get one',
    },
});

export default definedMessages;