/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_MESSAGE: {
        id: 'TR_MESSAGE',
        defaultMessage: 'Message',
        description: 'Used as a label for message input field in Sign and Verify form',
    },
    TR_SIGNATURE: {
        id: 'TR_SIGNATURE',
        defaultMessage: 'Signature',
        description: 'Used as a label for signature input field in Sign and Verify form',
    },
    TR_SIGN: {
        id: 'TR_SIGN',
        defaultMessage: 'Sign',
        description: 'Sign button in Sign and Verify form',
    },
    TR_VERIFY: {
        id: 'TR_VERIFY',
        defaultMessage: 'Verify',
        description: 'Verify button in Sign and Verify form',
    },
    TR_VERIFY_MESSAGE: {
        id: 'TR_VERIFY_MESSAGE',
        defaultMessage: 'Verify Message',
        description: 'Header for the Sign and Verify form',
    },
    TR_SIGN_MESSAGE: {
        id: 'TR_SIGN_MESSAGE',
        defaultMessage: 'Sign Message',
        description: 'Header for the Sign and Verify form',
    },
});

export default definedMessages;