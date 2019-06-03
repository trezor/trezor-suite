import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_BOOKMARK_HEADING: {
        id: 'TR_BOOKMARK_HEADING',
        defaultMessage: 'Browser bookmark',
        description: 'Heading in bookmark step',
    },
    TR_BOOKMARK_SUBHEADING: {
        id: 'TR_BOOKMARK_SUBHEADING',
        defaultMessage:
            'Protect yourself against {TR_PHISHING_ATTACKS}. Bookmark Trezor Wallet (wallet.trezor.io) to avoid visiting fake sites.',
        description: 'Heading in bookmark step',
    },
    TR_PHISHING_ATTACKS: {
        id: 'TR_PHISHING_ATTACKS',
        defaultMessage: 'phishing attacks',
        description:
            'Term, type of hacker attack trying to fool user to enter his sensitive data into a fake site.',
    },
    TR_USE_THE_KEYBOARD_SHORTCUT: {
        id: 'TR_USE_THE_KEYBOARD_SHORTCUT',
        defaultMessage: 'Use the keyboard shortcut:',
        description: 'We want user to pres Ctrl + D',
    },
});

export default definedMessages;
