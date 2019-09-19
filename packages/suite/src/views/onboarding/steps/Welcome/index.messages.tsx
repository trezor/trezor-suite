import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_WELCOME_TO_TREZOR: {
        id: 'TR_WELCOME_TO_TREZOR',
        defaultMessage: 'Welcome to Trezor',
        description: 'Welcome message on welcome page, heading.',
    },
    TR_WELCOME_TO_TREZOR_TEXT: {
        id: 'TR_WELCOME_TO_TREZOR_TEXT',
        defaultMessage: 'Let us take you through a short setup.',
        description: 'Welcome message on welcome page, longer text.',
    },
    TR_GET_STARTED: {
        id: 'TR_GET_STARTED',
        defaultMessage: 'Get started',
        description: 'Button on welcome page',
    },
    TR_USE_WALLET_NOW: {
        id: 'TR_USE_WALLET_NOW',
        defaultMessage: 'Use wallet now',
        description: 'Button on welcome page, use can take shorcut directly to wallet',
    },
});

export default definedMessages;
