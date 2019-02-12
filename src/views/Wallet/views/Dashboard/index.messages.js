/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    title: {
        id: 'dashboard.selectyourcoin.title',
        defaultMessage: 'Please select your coin',
        description: 'Title of the dashboard component if coin was not selected',
    },
    body: {
        id: 'dashboard.selectyourcoin.body',
        defaultMessage: 'You will gain access to receiving & sending selected coin',
        description: 'Content of the dashboard component if coin was not selected',
    },
});

export default definedMessages;