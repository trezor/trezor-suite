import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_DEVICE_IN_BOOTLOADER_MODE_INSTRUCTIONS: {
        id: 'TR_DEVICE_IN_BOOTLOADER_MODE_INSTRUCTIONS',
        defaultMessage:
            'Device is connected in bootloader mode. Plug out the USB cable and connect device again.',
        description: 'Instructions what to do if device is in bootloader mode',
    },
});

export default definedMessages;
