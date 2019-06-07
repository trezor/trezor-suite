import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_NAME_HEADING: {
        id: 'TR_NAME_HEADING',
        defaultMessage: 'Name your device',
        description: 'Heading in name step',
    },
    TR_NAME_HEADING_CHANGED: {
        id: 'TR_NAME_HEADING_CHANGED',
        defaultMessage: 'Hi, {label}',
        description: 'Subheading in name step after user changes label, so lets welcome him!',
    },
    TR_NAME_SUBHEADING: {
        id: 'TR_NAME_SUBHEADING',
        defaultMessage: 'Personalize your device with your own name.',
        description: 'Subheading in name step',
    },
    TR_NAME_CHANGED_TEXT: {
        id: 'TR_NAME_CHANGED_TEXT',
        defaultMessage:
            'Excellent, your device has a custom name now. It will be visible on your device display from now on.',
        description: 'Text to display after user has changed label.',
    },
    TR_NAME_ONLY_ASCII: {
        id: 'TR_NAME_ONLY_ASCII',
        defaultMessage: 'Name can contain only basic letters',
        description: 'Validation message in label input',
    },
    TR_NAME_TOO_LONG: {
        id: 'TR_NAME_TOO_LONG',
        defaultMessage: 'Name is too long',
        description: 'Validation message in label input',
    },
    TR_NAME_OK: {
        id: 'TR_NAME_OK',
        defaultMessage: 'Cool name',
        description: 'Validation message in label input',
    },
    TR_NAME_BORING: {
        id: 'TR_NAME_BORING',
        defaultMessage: 'Nah.. too boring, chose a different label',
        description: 'User shouldnt use My Trezor (default name) as their new custom name',
    },
});

export default definedMessages;
