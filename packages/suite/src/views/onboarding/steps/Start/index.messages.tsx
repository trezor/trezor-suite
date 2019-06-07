import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_START_HEADING: {
        id: 'TR_START_HEADING',
        defaultMessage: 'Create or recover',
        description: 'Heading in start page',
    },
    TR_RECOVERY_HEADING: {
        id: 'TR_RECOVERY_HEADING',
        defaultMessage: 'Recover your device',
        description: 'Heading in start page, when recovery process is active',
    },
    TR_START_CREATING: {
        id: 'TR_START_CREATING',
        defaultMessage: 'Creating',
        description:
            'Alternative heading text that is displayed when create new wallet call is in progress',
    },
    TR_START_FROM_SCRATCH: {
        id: 'TR_START_FROM_SCRATCH',
        defaultMessage: 'Start from scratch',
        description: 'Option in start page (create new wallet or recover)',
    },
    TR_RECOVER: {
        id: 'TR_RECOVER',
        defaultMessage: 'Recover',
        description: 'Option in start page (create new wallet or recover)',
    },
});

export default definedMessages;
