import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    url: AttributeDef<string>;
};

export const transactionTimeoutRetryEvent: EventDef<Attributes, EventType.TransactionTimeoutRetry> =
    {
        name: EventType.TransactionTimeoutRetry,
        descriptionTrigger:
            'fired when a transaction has timed out and the user clicks on the retry button',
        changelog: [{ version: '25.4.0', notes: 'added' }],

        attributes: {
            url: {
                changelog: [{ version: '25.4.0', notes: 'added' }],
                description: 'current URL where the retry button has been clicked',
            },
        },
    };
