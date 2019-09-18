import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_DEVICE_LABEL: {
        id: 'TR_DEVICE_LABEL',
        defaultMessage: 'Device label: {label}.',
        description: 'Display label of device',
    },
    TR_DEVICE_FIRMWARE_VERSION: {
        id: 'TR_DEVICE_FIRMWARE_VERSION',
        defaultMessage: 'Device firmware: {firmware}.',
        description: 'Display firmware of device',
    },
    TR_USER_HAS_WORKED_WITH_THIS_DEVICE: {
        id: 'TR_USER_HAS_WORKDED_WITH_THE_DEVICE',
        defaultMessage: 'I have worked with it before',
        description: 'Option to click when troubleshooting initialized device.',
    },
    TR_USER_HAS_NOT_WORKED_WITH_THIS_DEVICE: {
        id: 'TR_USER_HAS_NOT_WORKDED_WITH_THIS_DEVICE',
        defaultMessage: 'It is a brand new device, just unpacked',
        description: 'Option to click when troubleshooting initialized device.',
    },
    TR_INSTRUCTION_TO_SKIP: {
        id: 'TR_INSTRUCTION_TO_SKIP',
        defaultMessage:
            'You should skip setup and continue to wallet and check if you have any funds on this device.',
        description:
            'Instruction what to do when user knows the device he is holding was manipulated by him, not someone else.',
    },
    TR_USER_HAS_NOT_WORKED_WITH_THIS_DEVICE_INSTRUCTIONS: {
        id: 'TR_USER_HAS_NOT_WORKED_WITH_THIS_DEVICE_INSTRUCTIONS',
        defaultMessage:
            'In that case you should immediately contact Trezor support with detailed information on your purchase and refrain from using this device.',
        description: 'What to do if device is already initialized but not by user.',
    },
});

export default definedMessages;
