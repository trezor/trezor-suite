import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_NEWSLETTER_HEADING: {
        id: 'TR_NEWSLETTER_HEADING',
        defaultMessage: 'Stay in touch',
        description: 'Heading in newsletter step',
    },
    TR_NEWSLETTER_SUBHEADING: {
        id: 'TR_NEWSLETTER_SUBHEADING',
        defaultMessage: 'Receive information on important security updates',
        description: 'Subheading in newsletter step',
    },
    TR_THANK_YOU_FOR_EMAIL: {
        id: 'TR_THANK_YOU_FOR_EMAIL',
        defaultMessage:
            'Thank you for providing your email. To complete subscription, please click on the link we sent to your email. You can also follow us on socials:',
        description: 'Displayed after user submits contact email',
    },
    TR_EMAIL_SKIPPED: {
        id: 'TR_EMAIL_SKIPPED',
        defaultMessage:
            'You chose not to provide your email. This is Ok. If you want, you might still follow us on socials:',
        description: 'Displayed after user skips contact email',
    },
    TR_SENDING: {
        id: 'TR_SENDING',
        defaultMessage: 'Sending',
        description: 'Indicating progress status of email after submit.',
    },
    TR_SENDING_ERROR: {
        id: 'TR_SENDING_ERROR',
        defaultMessage: 'Failed to submit email',
        description: 'Indicating progress status of email after submit.',
    },
    TR_WRONG_EMAIL_FORMAT: {
        id: 'TR_WRONG_EMAIL_FORMAT',
        defaultMessage: 'Wrong email format',
        description: 'Validation text displayed under email input',
    },
});

export default definedMessages;
