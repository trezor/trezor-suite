/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_ADD_YOUR_TOKENS: {
        id: 'TR_ADD_YOUR_TOKENS',
        defaultMessage: 'Add your tokens',
    },
    TR_SEARCH_FOR_THE_TOKEN: {
        id: 'TR_SEARCH_FOR_THE_TOKEN',
        defaultMessage: 'Search for the token or add them manually by pasting token address into search input.',
    },
});

export default definedMessages;