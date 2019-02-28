/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_TERMS: {
        id: 'TR_TERMS',
        defaultMessage: 'Terms',
        description: 'As in Terms and Conditions, In the bottom footer',
    },
    TR_EXCHANGE_RATES_BY: {
        id: 'TR_EXCHANGE_RATES_BY',
        defaultMessage: 'Exchange rates by {service}',
    },
});

export default definedMessages;