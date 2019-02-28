/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_FIND_OUT_MORE_INFO: {
        id: 'TR_FIND_OUT_MORE_INFO',
        defaultMessage: 'Find out more info',
    },
    TR_MODEL_DOES_NOT_SUPPORT_COIN: {
        id: 'TR_MODEL_DOES_NOT_SUPPORT_COIN',
        defaultMessage: 'The coin {coin} is not supported by your Trezor model.',
    },
});

export default definedMessages;