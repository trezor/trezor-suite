import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<string, number>;

export const accountsNonZeroBalanceEvent: EventDef<Attributes, EventType.AccountsNonZeroBalance> = {
    name: EventType.AccountsNonZeroBalance,
    descriptionTrigger:
        'Fired when discovery of all accounts is completed (app start, coin added, account added), shows number of specific accounts with non-zero balance \n' +
        '(tokens included)',
    changelog: [
        { version: '1.23.0', notes: 'added' },
        { version: '23.1.1', notes: 'Tokens included' },
    ],
};
