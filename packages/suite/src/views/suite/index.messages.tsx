import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_DEVICE_SETTINGS: {
        id: 'TR_DEVICE_SETTINGS',
        defaultMessage: 'Device settings',
    },
    TR_APPLICATION_SETTINGS: {
        id: 'TR_APPLICATION_SETTINGS',
        defaultMessage: 'Application settings',
    },
    TR_SELECT_COINS_LINK: {
        id: 'TR_SELECT_COINS_LINK',
        defaultMessage: 'application settings',
    },
    TR_ACCOUNT_HASH: {
        id: 'TR_ACCOUNT_HASH',
        defaultMessage: 'Account #{number}',
        description: 'Used in auto-generated account label',
    },
    TR_DEVICE_LABEL_ACCOUNT_HASH: {
        id: 'TR_DEVICE_LABEL_ACCOUNT_HASH',
        defaultMessage: '{deviceLabel} Account #{number}',
        description: 'Used in auto-generated account label',
    },
    TR_LOOKS_LIKE_IT_IS_DEVICE_LABEL: {
        id: 'TR_LOOKS_LIKE_IT_IS_DEVICE_LABEL',
        defaultMessage:
            'Looks like it is {deviceLabel} Account #{number} address of {network} network',
        description: 'Example: Looks like it is My Trezor Account #1 address of ETH network',
    },
    TR_IMPORTED_ACCOUNT_HASH: {
        id: 'TR_IMPORTED_ACCOUNT_HASH',
        defaultMessage: 'Imported account #{number}',
        description: 'Used in auto-generated label for imported accounts',
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
    TR_FORGET_DEVICE: {
        id: 'TR_FORGET_DEVICE',
        defaultMessage: 'Forget device',
    },
    TR_CLOSE: {
        id: 'TR_CLOSE',
        defaultMessage: 'Close',
    },
    TR_HIDE_BALANCE: {
        id: 'TR_HIDE_BALANCE',
        defaultMessage: 'Hide balance',
    },
    TR_THE_ACCOUNT_BALANCE_IS_HIDDEN: {
        id: 'TR_THE_ACCOUNT_BALANCE_IS_HIDDEN',
        defaultMessage: 'The account balance is hidden.',
    },
    TR_CREATE_BACKUP_IN_3_MINUTES: {
        id: 'TR_CREATE_BACKUP_IN_3_MINUTES',
        defaultMessage: 'Create a backup in 3 minutes',
    },
    TR_YOUR_TREZOR_IS_NOT_BACKED_UP: {
        id: 'TR_YOUR_TREZOR_IS_NOT_BACKED_UP',
        defaultMessage: 'Your Trezor is not backed up',
    },
    TR_SHOW_ADDRESS_I_WILL_TAKE_THE_RISK: {
        id: 'TR_SHOW_ADDRESS_I_WILL_TAKE_THE_RISK',
        defaultMessage: 'Show address, I will take the risk',
    },
    TR_HIGH_FEE: {
        id: 'TR_HIGH_FEE',
        defaultMessage: 'High',
        description: 'fee level',
    },
    TR_NORMAL_FEE: {
        id: 'TR_NORMAL_FEE',
        defaultMessage: 'Normal',
        description: 'fee level',
    },
    TR_LOW_FEE: {
        id: 'TR_LOW_FEE',
        defaultMessage: 'Low',
        description: 'fee level',
    },
    TR_CUSTOM_FEE: {
        id: 'TR_CUSTOM_FEE',
        defaultMessage: 'Custom',
        description: 'fee level',
    },
    TR_IF_YOUR_DEVICE_IS_EVER_LOST: {
        id: 'TR_IF_YOUR_DEVICE_IS_EVER_LOST',
        defaultMessage:
            'If your device is ever lost or damaged, your funds will be lost. Backup your device first, to protect your coins against such events.',
    },
    TR_DEVICE_LABEL_IS_UNAVAILABLE: {
        id: 'TR_DEVICE_LABEL_IS_UNAVAILABLE',
        defaultMessage: 'Device "{deviceLabel}" is unavailable',
    },
});

export default definedMessages;
