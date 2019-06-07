import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_BACKUP_INSTRUCTION: {
        id: 'TR_BACKUP_INSTRUCTION',
        defaultMessage:
            'Now your device is going to show you 24 words to backup your wallet. Write them down. Do not disconnect your device.',
        description: 'The last instruction before initiating backup process',
    },
    TR_BACKUP_OK: {
        id: 'TR_BACKUP_OK',
        defaultMessage: 'Okey.',
        description: 'Button text. Ok, Lets go, or something similar.',
    },
    TR_WRITE_DOWN_NTH_WORD: {
        id: 'TR_WRITE_DOWN_NTH_WORD',
        defaultMessage: 'Write down {NthWord} from your device to your recovery seed card.',
        description:
            'Ordinal number of word that is currently displayed on Trezor device. For example: Check 1. word.',
    },
    TR_CHECK_NTH_WORD: {
        id: 'TR_CHECK_NTH_WORD',
        defaultMessage: 'Check {NthWord}',
        description: 'Ordinal number of word that is currently displayed on Trezor device.',
    },
});

export default definedMessages;
