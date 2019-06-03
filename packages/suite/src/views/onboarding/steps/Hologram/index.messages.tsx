import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_HOLOGRAM_STEP_HEADING: {
        id: 'TR_HOLOGRAM_STEPHEADING',
        defaultMessage: 'Hologram check',
        description: 'Heading on hologram step page',
    },
    TR_HOLOGRAM_STEP_SUBHEADING: {
        id: 'TR_HOLOGRAM_STEP_SUBHEADING',
        defaultMessage: 'Please make sure hologram protecting your device is authentic',
        description: 'Subheading on hologram step page',
    },
    TR_HOLOGRAM_STEP_ACTION_OK: {
        id: 'TR_HOLOGRAM_STEP_ACTION_OK',
        defaultMessage: 'My hologram is OK',
        description: 'Button to click in allright case',
    },
    TR_HOLOGRAM_STEP_ACTION_NOT_OK: {
        id: 'TR_HOLOGRAM_STEP_ACTION_NOT_OK',
        defaultMessage: 'My hologram looks different',
        description: 'Button to click when hologram looks different',
    },
    TR_RESELLERS_LINK: {
        id: 'TR_RESELLERS_LINK',
        defaultMessage: 'a trusted reseller',
        description:
            'Part of sentence TR_DID_YOU_PURCHASE. Link to page with trusted resellers list',
    },
    TR_CONTACT_OUR_SUPPORT_LINK: {
        id: 'TR_CONTACT_OUR_SUPPORT_LINK',
        defaultMessage: 'contact our support',
        description: 'Part of sentence TR_DID_YOU_PURCHASE. Link to support',
    },
    TR_PACKAGING_LINK: {
        id: 'TR_PACKAGING_LINK',
        defaultMessage: 'here',
        description: 'Part of sentence TR_DID_YOU_PURCHASE. Link to support',
    },
    TR_DID_YOU_PURCHASE: {
        id: 'TR_DID_YOU_PURCHASE',
        defaultMessage:
            'Please note, that device packaging including holograms have changed over time. You can check packaging details {TR_PACKAGING_LINK}. Also be sure you made your purchase from {TR_RESELLERS_LINK}. Otherwise, the device you are holding in your hands might be a counterfeit. Please {TR_CONTACT_OUR_SUPPORT_LINK}',
        description: 'Text to display when user is unhappy with his hologram.',
    },
});

export default definedMessages;
