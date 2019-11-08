import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_REQUEST_INSTANCE_HEADER: {
        id: 'TR_REQUEST_INSTANCE_HEADER',
        defaultMessage: 'Create hidden wallet with name "{deviceLabel}"?',
        description: 'Create virtual device with passphrase',
    },
    TR_REQUEST_INSTANCE_DESCRIPTION: {
        id: 'TR_REQUEST_INSTANCE_DESCRIPTION',
        defaultMessage:
            'Passphrase is an optional feature of the Trezor device that is recommended for advanced users only. It is a word or a sentence of your choice. Its main purpose is to access a hidden wallet.',
    },
    TR_CREATE_INSTANCE: {
        id: 'TR_CREATE_INSTANCE',
        defaultMessage: 'Create hidden wallet',
        description: 'Create button',
    },
});

export default definedMessages;
