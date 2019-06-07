import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_SEARCHING_TAKES_TOO_LONG: {
        id: 'TR_SEARCHING_TAKES_TOO_LONG',
        defaultMessage: 'Searching for your device takes too long, you might want to try to:',
        description:
            'Message to display when device is not detected after a decent period of time.',
    },
    TR_RECONNECT_INSTRUCTION: {
        id: 'TR_RECONNECT_INSTRUCTION',
        defaultMessage: 'Reconnect your device and wait for a while',
        description: 'Troubleshooting instruction',
    },
    TR_REFRESH_INSTRUCTION: {
        id: 'TR_REFRESH_INSTRUCTION',
        defaultMessage: 'Refresh your internet browser window',
        description: 'Troubleshooting instruction',
    },
    TR_ANOTHER_CABLE_INSTRUCTION: {
        id: 'TR_ANOTHER_CABLE_INSTRUCTION',
        defaultMessage: 'Try using another cable',
        description: 'Troubleshooting instruction',
    },
    TR_LAST_RESORT_INSTRUCTION: {
        id: 'TR_LAST_RESORT_INSTRUCTION',
        defaultMessage: 'If nothing helps, {ContactSupportLink}',
        description: 'Troubleshooting instruction. See TR_CONTACT_TREZOR_SUPPORT_LINK',
    },
    TR_CONTACT_TREZOR_SUPPORT_LINK: {
        id: 'TR_CONTACT_TREZOR_SUPPORT_LINK',
        defaultMessage: 'contact Trezor support.',
        description:
            'Full sentences: If nothing helps, contact Trezor support. See TR_LAST_RESORT_INSTRUCTION',
    },
});

export default definedMessages;
