/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_ITS_TIME_TO_UPDATE_FIRMWARE: {
        id: 'TR_ITS_TIME_TO_UPDATE_FIRMWARE',
        defaultMessage: 'It’s time to update your firmware',
    },
    TR_PLEASE_USE_OLD_WALLET: {
        id: 'TR_PLEASE_USE_OLD_WALLET',
        defaultMessage: 'Please use Bitcoin wallet interface to update your firmware.',
    },
});

export default definedMessages;