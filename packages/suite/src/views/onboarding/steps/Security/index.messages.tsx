import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_SECURITY_HEADING: {
        id: 'TR_SECURITY_HEADING',
        defaultMessage: 'Basic setup is done, but...',
        description: 'Heading in security page',
    },
    TR_SECURITY_SUBHEADING: {
        id: 'TR_SECURITY_SUBHEADING',
        defaultMessage:
            'Good job, your wallet is ready. But we strongly recommend you to spend few more minutes and improve your security.',
        description: 'Text in security page',
    },
    TR_GO_TO_SECURITY: {
        id: 'TR_GO_TO_SECURITY',
        defaultMessage: 'Take me to security (recommended)',
        description: 'Button in security page (start security setup)',
    },
    TR_SKIP_SECURITY: {
        id: 'TR_SKIP_SECURITY',
        defaultMessage: 'Skip for now',
        description: 'Button in security page (skip security setup)',
    },
});

export default definedMessages;
