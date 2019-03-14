/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_LOCAL_CURRENCY: {
        id: 'TR_LOCAL_CURRENCY',
        defaultMessage: 'Local currency',
    },
    TR_HIDE_BALANCE_EXPLAINED: {
        id: 'TR_HIDE_BALANCE_EXPLAINED',
        defaultMessage: 'Hides your account balance so nobody sees how much of a whale you are!',
    },
    TR_THE_CHANGES_ARE_SAVED: {
        id: 'TR_THE_CHANGES_ARE_SAVED',
        defaultMessage: 'The changes are saved automatically as they are made',
    },
});

export default definedMessages;
