/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype';

const definedMessages: Messages = defineMessages({
    TR_DEVICE_LABEL_IS_NOT_CONNECTED: {
        id: 'TR_DEVICE_LABEL_IS_NOT_CONNECTED',
        defaultMessage: 'Device {deviceLabel} is not connected',
    },
    TR_DEVICE_LABEL_IS_NOT_BACKED_UP: {
        id: 'TR_DEVICE_LABEL_IS_NOT_BACKED_UP',
        defaultMessage: 'Device {deviceLabel} is not backed up',
    },
    TR_DEVICE_LABEL_IS_UNAVAILABLE: {
        id: 'TR_DEVICE_LABEL_IS_UNAVAILABLE',
        defaultMessage: 'Device {deviceLabel} is unavailable',
    },
    TR_PLEASE_CONNECT_YOUR_DEVICE: {
        id: 'TR_PLEASE_CONNECT_YOUR_DEVICE',
        defaultMessage: 'Please connect your device to continue with the verification process',
    },
    TR_PLEASE_ENABLE_PASSPHRASE: {
        id: 'TR_PLEASE_ENABLE_PASSPHRASE',
        defaultMessage:
            'Please enable passphrase settings to continue with the verification process.',
    },
    TR_PLEASE_DISABLE_PASSPHRASE: {
        id: 'TR_PLEASE_DISABLE_PASSPHRASE',
        defaultMessage:
            'Please disable passphrase settings to continue with the verification process.',
    },
    TR_SHOW_UNVERIFIED_ADDRESS: {
        id: 'TR_SHOW_UNVERIFIED_ADDRESS',
        defaultMessage: 'Show unverified address',
    },
    TR_TO_PREVENT_PHISHING_ATTACKS_COMMA: {
        id: 'TR_TO_PREVENT_PHISHING_ATTACKS_COMMA',
        defaultMessage:
            'To prevent phishing attacks, you should verify the address on your Trezor first. {claim}',
    },
});

export default definedMessages;
