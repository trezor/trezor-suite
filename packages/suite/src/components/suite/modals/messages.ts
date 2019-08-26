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
});

export default definedMessages;
