import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
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
    // todo: candidate to be moved to common messages
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
});

export default definedMessages;
