import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_DEVICE_YOU_RECONNECTED_IS_DIFFERENT: {
        id: 'TR_DEVICE_YOU_RECONNECTED_IS_DIFFERENT',
        defaultMessage:
            'Device you reconnected is different from the previous device. Connect the right one or refresh your internet browser and start again.',
        description:
            'Text that indicates that user reconnected different device than he was working with before',
    },
    TR_CONNECTED_DEVICE_IS_IN_BOOTLOADER: {
        id: 'TR_CONNECTED_DEVICE_IS_IN_BOOTLOADER',
        defaultMessage: 'Connected device is in bootloader mode. Reconnect it to continue.',
        description: 'Text that indicates that user connected device in bootloader mode',
    },
    TR_DEVICE_IS_USED_IN_OTHER_WINDOW_HEADING: {
        id: 'TR_DEVICE_IS_USED_IN_OTHER_WINDOW_HEADING',
        defaultMessage: 'Device is used in other window',
        description: '',
    },
    TR_DEVICE_IS_USED_IN_OTHER_WINDOW_TEXT: {
        id: 'TR_DEVICE_IS_USED_IN_OTHER_WINDOW_TEXT',
        defaultMessage:
            'This is a big no no. Please dont use device in other window. Close all other windows or tabs that might be using your Trezor device.',
        description: '',
    },
    TR_DEVICE_IS_USED_IN_OTHER_WINDOW_BUTTON: {
        id: 'TR_DEVICE_IS_USED_IN_OTHER_WINDOW_BUTTON',
        defaultMessage: 'Continue',
        description: '',
    },
    TR_ENTER_PIN_HEADING: {
        id: 'TR_ENTER_PIN_HEADING',
        defaultMessage: 'Enter PIN',
        description: '',
    },
    TR_ENTER_PIN_TEXT: {
        id: 'TR_ENTER_PIN_TEXT',
        defaultMessage:
            'Your device gets locked anytime you disconnect it. You now need to enter your PIN to continue.',
        description: '',
    },
});

export default definedMessages;
