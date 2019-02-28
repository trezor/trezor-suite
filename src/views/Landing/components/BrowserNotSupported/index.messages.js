/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_YOUR_BROWSER_IS_NOT_SUPPORTED: {
        id: 'TR_YOUR_BROWSER_IS_NOT_SUPPORTED',
        defaultMessage: 'Your browser is not supported',
    },
    TR_PLEASE_CHOOSE_ONE_OF_THE_SUPPORTED: {
        id: 'TR_PLEASE_CHOOSE_ONE_OF_THE_SUPPORTED',
        defaultMessage: 'Please choose one of the supported browsers',
    },
    TR_GET_CHROME: {
        id: 'TR_GET_CHROME',
        defaultMessage: 'Get Chrome',
    },
    TR_GET_FIREFOX: {
        id: 'TR_GET_FIREFOX',
        defaultMessage: 'Get Firefox',
    },
});

export default definedMessages;