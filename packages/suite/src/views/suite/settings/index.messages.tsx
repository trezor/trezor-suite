import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    // TITLE
    TR_DEVICE_SETTINGS_TITLE: {
        id: 'TR_DEVICE_SETTINGS_TITLE',
        defaultMessage: 'Device Settings',
    },
    // LABEL
    TR_DEVICE_SETTINGS_DEVICE_LABEL: {
        id: 'TR_DEVICE_SETTINGS_DEVICE_LABEL',
        defaultMessage: 'Device Label',
    },
    TR_DEVICE_SETTINGS_DEVICE_EDIT_LABEL: {
        id: 'TR_DEVICE_SETTINGS_DEVICE_EDIT_LABEL',
        defaultMessage: 'Edit label',
    },
    // PIN
    TR_DEVICE_SETTINGS_PIN_PROTECTION_TITLE: {
        id: 'TR_DEVICE_SETTINGS_PIN_PROTECTION_TITLE',
        defaultMessage: 'PIN protection',
    },
    TR_DEVICE_SETTINGS_PIN_PROTECTION_DESC: {
        id: 'TR_DEVICE_SETTINGS_PIN_PROTECTION_DESC',
        defaultMessage:
            'Using PIN protection is highly recommended. PIN prevents unauthorized persons from stealing your funds even if they have physical access to your device.',
    },
    // PASSPHRASE
    TR_DEVICE_SETTINGS_PASSPHRASE_TITLE: {
        id: 'TR_DEVICE_SETTINGS_PIN_PROTECTION_DESC_MORE',
        defaultMessage: 'Passphrase',
    },
    TR_DEVICE_SETTINGS_PASSPHRASE_DESC: {
        id: 'TR_DEVICE_SETTINGS_PIN_PROTECTION_DESC',
        defaultMessage:
            'Passphrase encryption adds an extra custom word to your recovery seed. This allows you to access new wallets, each hidden behind a particular passphrase. Your old accounts will be accessible with an empty passphrase.',
    },
    TR_DEVICE_SETTINGS_PASSPHRASE_DESC_MORE: {
        id: 'TR_DEVICE_SETTINGS_PIN_PROTECTION_DESC',
        defaultMessage:
            'If you forget your passphrase, your wallet is lost for good. There is no way to recover your funds.',
    },
});

export default definedMessages;
