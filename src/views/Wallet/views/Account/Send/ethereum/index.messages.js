/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_SEND_ETHEREUM_OR_TOKENS: {
        id: 'TR_SEND_ETHEREUM_OR_TOKENS',
        defaultMessage: 'Send Ethereum or tokens',
    },
    YOU_HAVE_TOKEN_BALANCE: {
        id: 'YOU_HAVE_TOKEN_BALANCE',
        defaultMessage: 'You have: {tokenBalance}',
    },
});

export default definedMessages;