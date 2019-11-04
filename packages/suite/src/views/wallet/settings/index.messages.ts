import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_LOCAL_CURRENCY: {
        id: 'TR_LOCAL_CURRENCY',
        defaultMessage: 'Local currency',
    },
    TR_HIDE_BALANCE_EXPLAINED: {
        id: 'TR_HIDE_BALANCE_EXPLAINED',
        defaultMessage:
            "Hides your account balance so you don't have to worry about anyone looking over your shoulder.",
    },
    TR_THE_CHANGES_ARE_SAVED: {
        id: 'TR_THE_CHANGES_ARE_SAVED',
        defaultMessage: 'The changes are saved automatically as they are made',
    },
    TR_VISIBLE_COINS: {
        id: 'TR_VISIBLE_COINS',
        defaultMessage: 'Visible coins',
    },
    TR_VISIBLE_COINS_EXPLAINED: {
        id: 'TR_VISIBLE_COINS_EXPLAINED',
        defaultMessage:
            'Select the coins you wish to see in the wallet interface. You will be able to change your preferences later.',
    },
    TR_VISIBLE_TESTNET_COINS: {
        id: 'TR_VISIBLE_TESTNET_COINS',
        defaultMessage: 'Visible testnet coins',
    },
    TR_VISIBLE_TESTNET_COINS_EXPLAINED: {
        id: 'TR_VISIBLE_TESTNET_COINS_EXPLAINED',
        defaultMessage:
            'Testnet coins dont have any value but you still may use them to learn and experiment.',
    },
});

export default definedMessages;
