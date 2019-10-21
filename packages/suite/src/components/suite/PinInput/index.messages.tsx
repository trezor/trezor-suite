import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_ENTER_PIN: {
        id: 'TR_ENTER_PIN',
        defaultMessage: 'Enter PIN',
        description: 'Button. Submit PIN',
    },
    TR_PIN_MANUAL_LINK: {
        id: 'TR_PIN_MANUAL_LINK',
        defaultMessage: 'Learn more',
        description: 'Link to PIN manual',
    },
    TR_NOT_SURE_HOW_PIN_WORKS: {
        id: 'TR_NOT_SURE_HOW_PIN_WORKS',
        defaultMessage: 'Not sure how PIN works? {TR_PIN_MANUAL_LINK}',
        description: 'Link to PIN manual',
    },
});

export default definedMessages;
