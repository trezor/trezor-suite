/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_XRP_RESERVE: {
        id: 'TR_XRP_RESERVE',
        defaultMessage: 'Reserve: {value}',
        description: 'XRP reserve input label',
    },
    TR_SEND_RIPPLE: {
        id: 'TR_SEND_RIPPLE',
        defaultMessage: 'Send Ripple',
    },
});

export default definedMessages;