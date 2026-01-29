import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    symbol: AttributeDef<string>;
    format: AttributeDef<'pdf' | 'csv' | 'json'>;
};

export const accountsTransactionsExportEvent: EventDef<
    Attributes,
    EventType.AccountsTransactionsExport
> = {
    name: EventType.AccountsTransactionsExport,
    descriptionTrigger: 'On transactions export',
    changelog: [{ version: '1.23.0', notes: 'added' }],

    attributes: {
        symbol: {
            changelog: [{ version: '1.23.0', notes: 'added' }],
        },
        format: {
            changelog: [{ version: '1.23.0', notes: 'added' }],
        },
    },
};
