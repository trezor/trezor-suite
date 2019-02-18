/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_YOU_ARE_IN_YOUR_STANDARD_WALLET: {
        id: 'TR_YOU_ARE_IN_YOUR_STANDARD_WALLET',
        defaultMessage: 'You are in your standard wallet.',
    },
    TR_YOU_ARE_IN_YOUR_HIDDEN_WALLET: {
        id: 'TR_YOU_ARE_IN_YOUR_WALLET',
        defaultMessage: 'You are in your hidden wallet.',
    },
    TR_CLICK_HERE_TO_ACCESS_YOUR_HIDDEN: {
        id: 'TR_CLICK_HERE_TO_ACCESS_YOUR_HIDDEN',
        defaultMessage: 'Click here to access your hidden wallet.',
    },
    TR_CLICK_HERE_TO_ACCESS_YOUR_STANDARD: {
        id: 'TR_CLICK_HERE_TO_ACCESS_YOUR_STANDARD',
        defaultMessage: 'Click here to access your standard or another hidden wallet.',
    },
    TR_TO_ACCESS_OTHER_WALLETS: {
        id: 'TR_TO_ACCESS_OTHER_WALLETS',
        defaultMessage: 'To access other wallets please connect your device.',
    },
    TR_NEED_HELP: {
        id: 'TR_NEED_HELP',
        defaultMessage: 'Need help?',
    },
    TR_NUMBER_OF_DEVICES: {
        id: 'TR_NUMBER_OF_DEVICES',
        defaultMessage: 'Number of devices',
    },
});

export default definedMessages;