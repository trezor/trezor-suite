import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_TREZOR_WALLET_IS_AN_EASY_DASH: {
        id: 'TR_TREZOR_WALLET_IS_AN_EASY_DASH',
        defaultMessage:
            'Trezor Wallet is an easy-to-use interface for your Trezor. Trezor Wallet allows you to easily control your funds, manage your balance and initiate transfers.',
    },
    TR_CONNECT_TREZOR: {
        id: 'TR_CONNECT_TREZOR',
        defaultMessage: 'Connect Trezor to continue...',
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
        defaultMessage: "Don't have a Trezor? {getOne}",
    },
    TR_GET_ONE: {
        id: 'TR_GET_ONE',
        description: 'Part of the sentence: Dont have a Trezor? Get one',
        defaultMessage: 'Get one',
    },
    TR_UNPLUG_DEVICE_LABEL: {
        id: 'TR_UNPLUG_DEVICE_LABEL',
        defaultMessage: 'Unplug "{deviceLabel}" device',
    },
});

export default definedMessages;
