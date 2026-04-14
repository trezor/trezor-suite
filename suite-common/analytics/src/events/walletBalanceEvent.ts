import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    nonZeroBalance: AttributeDef<number>;
};

export const walletBalanceEvent: EventDef<Attributes, EventType.AccountsBalance> = {
    name: EventType.AccountsBalance,
    descriptionTrigger:
        'Fired on app start and after discovery. Fires first time when balances are known and then debounced to fire at most once per 10 minutes.',
    changelog: [{ version: '26.5.1', notes: 'added' }],

    attributes: {
        nonZeroBalance: {
            changelog: [{ version: '26.5.1', notes: 'added' }],
            description: 'Number of accounts with non-zero balance',
        },
    },
};
