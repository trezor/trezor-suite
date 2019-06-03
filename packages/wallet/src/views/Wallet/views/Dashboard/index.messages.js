/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype';

const definedMessages: Messages = defineMessages({
    TR_PLEASE_SELECT_YOUR: {
        id: 'TR_PLEASE_SELECT_YOUR',
        defaultMessage: 'Please select your coin',
        description: 'Title of the dashboard component if coin was not selected',
    },
    TR_PLEASE_SELECT_YOUR_EMPTY: {
        id: 'TR_PLEASE_SELECT_YOUR_EMPTY',
        defaultMessage: 'Please select your coin in {TR_SELECT_COINS_LINK}',
        description: 'Title of the dashboard component if coin was not selected',
    },
    TR_YOU_WILL_GAIN_ACCESS: {
        id: 'TR_YOU_WILL_GAIN_ACCESS',
        defaultMessage: 'You will gain access to receiving & sending selected coin',
        description: 'Content of the dashboard component if coin was not selected',
    },
});

export default definedMessages;
