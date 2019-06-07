/* @flow */
import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_TERMS: {
        id: 'TR_TERMS',
        defaultMessage: 'Terms',
        description: 'As in Terms and Conditions, In the bottom footer',
    },
    TR_EXCHANGE_RATES_BY: {
        id: 'TR_EXCHANGE_RATES_BY',
        defaultMessage: 'Exchange rates by {service}',
    },
    TR_WE_THANK_OUR_TRANSLATORS: {
        id: 'TR_WE_THANK_OUR_TRANSLATORS',
        defaultMessage: 'We thank our translators for their {TR_CONTRIBUTION}',
    },
    TR_CONTRIBUTION: {
        id: 'TR_CONTRIBUTION',
        defaultMessage: 'contribution',
        description: 'Part of the sentence: We thank our translators for their contribution',
    },
});

export default definedMessages;
