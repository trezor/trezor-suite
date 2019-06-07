import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_BACKUP_HEADING: {
        id: 'TR_BACKUP_HEADING',
        defaultMessage: 'Create or recover',
        description: 'Heading in start page',
    },
    TR_BACKUP_SUBHEADING_1: {
        id: 'TR_BACKUP_SUBHEADING_1',
        defaultMessage:
            'Your {TR_SEED_MANUAL_LINK} is the backup key to all your cryptocurrencies and applications.',
        description: 'Explanation what recovery seed is',
    },
    TR_SEED_MANUAL_LINK: {
        id: 'TR_SEED_MANUAL_LINK',
        defaultMessage: 'recovery seed',
        description: 'Link. Part of TR_BACKUP_SUBHEADING_1',
    },
    TR_BACKUP_SUBHEADING_2: {
        id: 'TR_BACKUP_SUBHEADING_2',
        defaultMessage:
            'Your recovery seed can only be displayed once. Never make a digital copy of your recovery seed and never upload it online. Keep your recovery seed in a safe place.',
        description: 'Explanation what recovery seed is',
    },
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
    TR_SEED_IS_MORE_IMPORTANT_THAN_YOUR_DEVICE: {
        id: 'TR_SEED_IS_MORE_IMPORTANT_THAN_YOUR_DEVICE',
        defaultMessage: 'Seed is more important than your device',
        description: 'Instruction what user should never do with his seed.',
    },
    TR_SATOSHILABS_CANNOT_BE_HELD_RESPONSIBLE: {
        id: 'TR_SATOSHILABS_CANNOT_BE_HELD_RESPONSIBLE',
        defaultMessage:
            'SatoshiLabs cannot be held responsible for security liabilities or financial losses resulting from not following security instructions described here.',
        description: 'Liability disclaimer.',
    },
    TR_I_HAVE_READ_INSTRUCTIONS: {
        id: 'TR_I_HAVE_READ_INSTRUCTIONS',
        defaultMessage: 'I have read the instructions and agree',
        description: 'Checkbox text',
    },
    TR_START_BACKUP: {
        id: 'TR_START_BACKUP',
        defaultMessage: 'Start backup',
        description: 'Button text',
    },
    TR_DEVICE_DISCONNECTED_DURING_ACTION: {
        id: 'TR_DEVICE_DISCONNECTED_DURING_ACTION',
        defaultMessage: 'Device disconnected during action',
        description: 'Error message',
    },
    TR_DEVICE_DISCONNECTED_DURING_ACTION_DESCRIPTION: {
        id: 'TR_DEVICE_DISCONNECTED_DURING_ACTION_DESCRIPTION',
        defaultMessage:
            'You device disconnected during action which resulted in interuption of backup process. For security reasons you need to wipe your device now and start the backup process again.',
        description: 'Error message. Instruction what to do.',
    },
    TR_WIPE_DEVICE_AND_START_AGAIN: {
        id: 'TR_WIPE_DEVICE_AND_START_AGAIN',
        defaultMessage: 'Wipe device and start again',
        description: 'Button text',
    },
    TR_BACKUP_FINISHED_TEXT: {
        id: 'TR_BACKUP_FINISHED_TEXT',
        defaultMessage:
            'Backup is now on your recovery seed card. Once again dont lose it and keep it private!',
        description: 'Text that appears after backup is finished',
    },
    TR_BACKUP_FINISHED_BUTTON: {
        id: 'TR_BACKUP_FINISHED_BUTTON',
        defaultMessage: 'My recovery card is safe',
        description: 'Exit button after backup is finished',
    },
});

export default definedMessages;
