import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_RECOVER_HEADING: {
        id: 'TR_RECOVER_HEADING',
        defaultMessage: 'Recover your device',
        description: 'Heading in recover page',
    },
    TR_RECOVER_SUBHEADING: {
        id: 'TR_RECOVER_SUBHEADING',
        defaultMessage:
            'It is possible to re-create device from bip39 backup. First of all, chose number of words of your backup.',
        description: 'Subheading in recover page. Basic info about recovery',
    },
    TR_RECOVER_SUBHEADING_MODEL_T: {
        id: 'TR_RECOVER_SUBHEADING_MODEL_T',
        defaultMessage: 'On model T the entire recovery process is doable on device.',
        description: 'Subheading in recover page. Basic info about recovery',
    },
    TR_WORDS: {
        id: 'TR_WORDS',
        defaultMessage: '{count} words',
        description: 'Number of words. For example: 12 words',
    },
    TR_START_RECOVERY: {
        id: 'TR_START_RECOVERY',
        defaultMessage: 'Start recovery',
        description: 'Button.',
    },
    TR_RECOVERY_TYPES_DESCRIPTION: {
        id: 'TR_RECOVERY_TYPES_DESCRIPTION',
        defaultMessage:
            'Both methods are safe. Basic recovery uses on computer input of words in randomized order. Advanced recovery uses on-screen input to load your recovery seed. {TR_LEARN_MORE_LINK}',
        description: 'There are two methods of recovery for T1. This is a short explanation text.',
    },
    TR_BASIC_RECOVERY_OPTION: {
        id: 'TR_BASIC_RECOVERY_OPTION',
        defaultMessage: 'Basic recovery (2 minutes)',
        description: 'Button for selecting basic recovery option',
    },
    TR_ADVANCED_RECOVERY_OPTION: {
        id: 'TR_ADVANCED_RECOVERY_OPTION',
        defaultMessage: 'Advanced recovery (5 minutes)',
        description: 'Button for selecting advanced recovery option',
    },
    TR_ENTER_SEED_WORDS_INSTRUCTION: {
        id: 'TR_ENTER_SEED_WORDS_INSTRUCTION',
        defaultMessage: 'Enter words from your seed in order displayed on your device.',
        description:
            'User is instructed to enter words from seed (backup) into the form in browser',
    },
    TR_RANDOM_SEED_WORDS_DISCLAIMER: {
        id: 'TR_RANDOM_SEED_WORDS_DISCLAIMER',
        defaultMessage:
            'Please note, that to maximaze security, your device will ask you to enter {count} fake words that are not part of your seed.',
        description:
            'User is instructed to enter words from seed (backup) into the form in browser',
    },
    TR_CHECK_YOUR_DEVICE: {
        id: 'TR_CHECK_YOUR_DEVICE',
        defaultMessage: 'Check your device',
        description: 'Placeholder in seed input asking user to pay attention to his device',
    },
    TR_MORE_WORDS_TO_ENTER: {
        id: 'TR_MORE_WORDS_TO_ENTER',
        defaultMessage: '{count} words to enter.',
        description: 'How many words will user need to enter before recovery is finished.',
    },
    TR_RECOVERY_ERROR: {
        id: 'TR_RECOVERY_ERROR',
        defaultMessage: 'Device recovery failed with error: {error}',
        description: 'Error during recovery. For example wrong word retyped or device disconnected',
    },
    TR_RECOVERY_SUCCESS: {
        id: 'TR_RECOVERY_SUCCESS',
        defaultMessage: 'Excellent, you recovered device from seed.',
        description: 'This is displayed upon successful recovery',
    },
});

export default definedMessages;
