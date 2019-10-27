import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_DO_NOT_UPLOAD_INSTRUCTION: {
        id: 'TR_DO_NOT_UPLOAD_INSTRUCTION',
        defaultMessage: 'Do not upload words on the internet',
        description: 'Instruction what user should never do with his seed.',
    },
    TR_HIDE_TO_SAFE_PLACE_INSTRUCTION: {
        id: 'TR_HIDE_TO_SAFE_PLACE_INSTRUCTION',
        defaultMessage: 'Hide them somewhere safe',
        description: 'Instruction what user should do with his seed.',
    },
    TR_DO_NOT_SAFE_IN_COMPUTER_INSTRUCTION: {
        id: 'TR_DO_NOT_SAFE_IN_COMPUTER_INSTRUCTION',
        defaultMessage: 'Do not write it into a computer',
        description: 'Instruction what user should never do with his seed.',
    },
    TR_DO_NOT_TAKE_PHOTO_INSTRUCTION: {
        id: 'TR_DO_NOT_TAKE_PHOTO_INSTRUCTION',
        defaultMessage: 'Do not take a photo of your recovery seed',
        description: 'Instruction what user should never do with his seed.',
    },
});

export default definedMessages;
