/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_OTHER_COINS: {
        id: 'TR_OTHER_COINS',
        defaultMessage: 'Other coins',
    },
    TR_SELECT_COINS: {
        id: 'TR_SELECT_COINS',
        description: 'COMPLETE SENTENCE: Select a coin in application settings',
        defaultMessage: 'Select a coin in {TR_SELECT_COINS_LINK}',
    },
    TR_SELECT_COINS_LINK: {
        id: 'TR_SELECT_COINS_LINK',
        defaultMessage: 'application settings',
    },
});

export default definedMessages;
