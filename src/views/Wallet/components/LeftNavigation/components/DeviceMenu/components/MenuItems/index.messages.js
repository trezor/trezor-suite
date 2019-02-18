/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_CHANGE_WALLET_TYPE: {
        id: 'TR_CHANGE_WALLET_TYPE',
        defaultMessage: 'Change wallet type',
    },
    TR_RENEW_SESSION: {
        id: 'TR_RENEW_SESSION',
        defaultMessage: 'Renew session',
        description: 'TODO',
    },
    TR_FORGET_DEVICE: {
        id: 'TR_FORGET_DEVICE',
        defaultMessage: 'Forget device',
    },
});

export default definedMessages;