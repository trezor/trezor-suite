/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_MINIMUM_ACCOUNT_RESERVE_REQUIRED: {
        id: 'TR_MINIMUM_ACCOUNT_RESERVE_REQUIRED',
        defaultMessage: 'Minimum account reserve required',
    },
    TR_RIPPLE_ADDRESSES_REQUIRE_MINIMUM_BALANCE: {
        id: 'TR_RIPPLE_ADDRESSES_REQUIRE_MINIMUM_BALANCE',
        defaultMessage: 'Ripple addresses require a minimum balance of {minBalance} XRP to activate and maintain the account. {TR_LEARN_MORE}',
    },
});

export default definedMessages;