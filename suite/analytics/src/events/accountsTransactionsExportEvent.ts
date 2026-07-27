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
    descriptionTrigger:
        'User exports account transactions in a selected format (PDF, CSV, or JSON)',
    changelog: [{ version: '1.23.0', notes: 'added' }],

    attributes: {
        symbol: {
            description:
                'The blockchain network or asset symbol for which transactions are being exported',
            changelog: [{ version: '1.23.0', notes: 'added' }],
        },
        format: {
            description:
                'The export format selected: `pdf` for PDF document, `csv` for CSV spreadsheet, `json` for JSON data',
            changelog: [{ version: '1.23.0', notes: 'added' }],
        },
    },
};
