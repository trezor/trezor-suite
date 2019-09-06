import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_FORGET_LABEL: {
        id: 'TR_FORGET_LABEL',
        defaultMessage: 'Forget {deviceLabel}?',
    },
    TR_PASSPHRASE_LABEL: {
        id: 'TR_PASSPHRASE_LABEL',
        defaultMessage: 'Enter "{deviceLabel}" passphrase',
    },
    TR_CANCEL: {
        id: 'TR_CANCEL',
        defaultMessage: 'Cancel',
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
    TR_ACCOUNT_HASH: {
        id: 'TR_ACCOUNT_HASH',
        defaultMessage: 'Account #{number}',
        description: 'Used in auto-generated account label',
    },
    TR_YOUR_TREZOR_IS_NOT_BACKED_UP: {
        id: 'TR_YOUR_TREZOR_IS_NOT_BACKED_UP',
        defaultMessage: 'Your Trezor is not backed up',
    },
    TR_IF_YOUR_DEVICE_IS_EVER_LOST: {
        id: 'TR_IF_YOUR_DEVICE_IS_EVER_LOST',
        defaultMessage:
            'If your device is ever lost or damaged, your funds will be lost. Backup your device first, to protect your coins against such events.',
    },
    TR_CREATE_BACKUP_IN_3_MINUTES: {
        id: 'TR_CREATE_BACKUP_IN_3_MINUTES',
        defaultMessage: 'Create a backup in 3 minutes',
    },
    TR_SHOW_ADDRESS_I_WILL_TAKE_THE_RISK: {
        id: 'TR_SHOW_ADDRESS_I_WILL_TAKE_THE_RISK',
        defaultMessage: 'Show address, I will take the risk',
    },
    TR_TRY_AGAIN: {
        id: 'TR_TRY_AGAIN',
        defaultMessage: 'Try again',
        description: 'Try to run the process again',
    },
    TR_COMPLETE_ACTION_ON_DEVICE: {
        id: 'TR_COMPLETE_ACTION_ON_DEVICE',
        defaultMessage: 'Complete the action on "{device.label}" device',
    },
});

export default definedMessages;
