/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_THE_PIN_LAYOUT_IS_DISPLAYED_ON: {
        id: 'TR_THE_PIN_LAYOUT_IS_DISPLAYED_ON',
        defaultMessage: 'The PIN layout is displayed on your Trezor.',
    },
    TR_ENTER_DEVICE_PIN: {
        id: 'TR_ENTER_DEVICE_PIN',
        defaultMessage: 'Enter {deviceLabel} PIN',
    },
    TR_ENTER_PIN: {
        id: 'TR_ENTER_PIN',
        defaultMessage: 'Enter PIN',
    },
    TR_NOT_SURE_HOW_PIN_WORKS: {
        id: 'TR_NOT_SURE_HOW_PIN_WORKS',
        defaultMessage: 'Not sure how PIN works? {TR_LEARN_MORE}',
    },
});

export default definedMessages;