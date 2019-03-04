/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_DEVICE_SETTINGS: {
        id: 'TR_DEVICE_SETTINGS',
        defaultMessage: 'Device settings',
    },
    TR_ACCOUNT_HASH: {
        id: 'TR_ACCOUNT_HASH',
        defaultMessage: 'Account #{number}',
        description: 'Used in auto-generated account label',
    },
    TR_CLEAR: {
        id: 'TR_CLEAR',
        defaultMessage: 'Clear',
        description: 'Clear form button',
    },
    TR_CHECK_FOR_DEVICES: {
        id: 'TR_CHECK_FOR_DEVICES',
        defaultMessage: 'Check for devices',
    },
    TR_ADDRESS: {
        id: 'TR_ADDRESS',
        defaultMessage: 'Address',
        description: 'Used as label for receive/send address input',
    },
    TR_LOADING_DOT_DOT_DOT: {
        id: 'TR_LOADING_DOT_DOT_DOT',
        defaultMessage: 'Loading...',
    },
    TR_TAKE_ME_TO_BITCOIN_WALLET: {
        id: 'TR_TAKE_ME_TO_BITCOIN_WALLET',
        defaultMessage: 'Take me to the Bitcoin wallet',
    },
    TR_I_WILL_DO_THAT_LATER: {
        id: 'TR_I_WILL_DO_THAT_LATER',
        defaultMessage: 'I’ll do that later.',
    },
    TR_SHOW_DETAILS: {
        id: 'TR_SHOW_DETAILS',
        defaultMessage: 'Show details',
    },
    TR_UPGRADE_FOR_THE_NEWEST_FEATURES_DOT: {
        id: 'TR_UPGRADE_FOR_THE_NEWEST_FEATURES_DOT',
        defaultMessage: 'Upgrade for the newest features.',
    },
    TR_LEARN_MORE: {
        id: 'TR_LEARN_MORE',
        defaultMessage: 'Learn more',
    },
    TR_GO_TO_STANDARD_WALLET: {
        id: 'TR_GO_TO_STANDARD_WALLET',
        defaultMessage: 'Go to your standard wallet',
    },
    TR_GO_TO_HIDDEN_WALLET: {
        id: 'TR_GO_TO_HIDDEN_WALLET',
        defaultMessage: 'Go to your hidden wallet',
    },
    TR_FORGET_DEVICE: {
        id: 'TR_FORGET_DEVICE',
        defaultMessage: 'Forget device',
    },
});

export default definedMessages;
