import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_PIN_HEADING_FIRST: {
        id: 'TR_PIN_HEADING_FIRST',
        defaultMessage: 'Set new PIN',
        description: 'Heading in PIN page when entering PIN for the first time',
    },
    TR_PIN_HEADING_REPEAT: {
        id: 'TR_PIN_HEADING_REPEAT',
        defaultMessage: 'Repeat PIN',
        description: 'Heading in PIN page when repeating PIN',
    },
    TR_PIN_HEADING_SUCCESS: {
        id: 'TR_PIN_HEADING_SUCCESS',
        defaultMessage: 'PIN enabled',
        description: 'Heading in PIN page when PIN set',
    },
    TR_PIN_HEADING_MISMATCH: {
        id: 'TR_PIN_HEADING_MISMATCH',
        defaultMessage: 'PIN mismatch',
        description: 'Heading in PIN page when PIN repeated incorrectly',
    },
    TR_PIN_SUBHEADING: {
        id: 'TR_PIN_SUBHEADING',
        defaultMessage: 'Protect device from unauthorized access by using a strong pin.',
        description: 'Subheading on PIN page',
    },
    TR_SET_PIN: {
        id: 'TR_SET_PIN',
        defaultMessage: 'Set pin',
        description: 'Button text',
    },
    TR_PIN_ENTERING_DESCRIPTION: {
        id: 'TR_PIN_ENTERING_DESCRIPTION',
        defaultMessage:
            'In order to secure maximum security, we do not display pin on your computer. We will just show a blind matrix, real layout is displayed on your device.',
        description: 'Text describe how to enter PIN o trezor device',
    },
    TR_FIRST_PIN_ENTERED: {
        id: 'TR_FIRST_PIN_ENTERED',
        defaultMessage:
            'Good. You entered a new pin. But to make sure you did not make mistake, please enter it again. Look at your device now, numbers are now different.',
        description: 'Text describing what happens after user enters PIN for the first time.',
    },
    TR_PIN_SET_SUCCESS: {
        id: 'TR_PIN_SET_SUCCESS',
        defaultMessage: 'Purfect! Your device is now secured by pin.',
        description: 'Longer text indicating PIN was set succesfully.',
    },
    TR_PIN_ERROR_TROUBLESHOOT: {
        id: 'TR_PIN_ERROR_TROUBLESHOOT',
        defaultMessage:
            'Are you confused, how PIN works? You can always refer to our {TR_DOCUMENTATION}',
        description: 'Troubleshooting text after user enters second PIN incorrectly.',
    },
    TR_DOCUMENTATION: {
        id: 'TR_DOCUMENTATION',
        defaultMessage: 'documentation',
        description: 'Link to trezor documentation (wiki)',
    },
    TR_START_AGAIN: {
        id: 'TR_START_AGAIN',
        defaultMessage: 'Start again',
        description: 'Button text',
    },
});

export default definedMessages;
