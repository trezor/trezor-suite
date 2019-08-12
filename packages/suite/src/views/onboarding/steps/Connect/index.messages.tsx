import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_CONNECT_HEADING: {
        id: 'TR_CONNECT_HEADING',
        defaultMessage: 'Time to connect your device',
        description: 'Heading on connect page',
    },
    TR_MAKE_SURE_IT_IS_WELL_CONNECTED: {
        id: 'TR_MAKE_SURE_IT_IS_WELL_CONNECTED',
        defaultMessage: 'Make sure your device is well connected to avoid communication failures.',
        description: 'Instruction for connecting device.',
    },
    TR_SEARCHING_FOR_YOUR_DEVICE: {
        id: 'TR_SEARCHING_FOR_YOUR_DEVICE',
        defaultMessage: 'Searching for your device',
        description: 'Indication that we app does not see connected device yet.',
    },
    TR_DEVICE_DETECTED: {
        id: 'TR_DEVICE_DETECTED',
        defaultMessage: 'Device detected',
        description: 'App can see connected device',
    },
    TR_FOUND_OK_DEVICE: {
        id: 'TR_FOUND_OK_DEVICE',
        defaultMessage: 'Found an empty device, yay! You can continue now.',
        description: 'Case when device was connected and it is in expected state (not initialized)',
    },
    TR_DEVICE_IN_BOOTLOADER_MODE: {
        id: 'TR_DEVICE_IN_BOOTLOADER_MODE',
        defaultMessage: 'Device in bootloader mode',
        description: 'Indication that device is in bootloader mode',
    },
    TR_DEVICE_IS_INITIALIZED: {
        id: 'TR_DEVICE_IS_INITIALIZED',
        defaultMessage: 'Device is initialized',
        description: 'Indication that device is in already initialized',
    },
});

export default definedMessages;
