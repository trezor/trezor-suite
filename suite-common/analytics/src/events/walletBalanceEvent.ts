import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    nonZeroBalance: AttributeDef<number>;
};

export const walletBalanceEvent: EventDef<Attributes, EventType.AccountsBalance> = {
    name: EventType.AccountsBalance,
    descriptionTrigger:
        'Fired after app start and whenever the total balance state (some balance | no balance) changes.',
    changelog: [{ version: '26.5.1', notes: 'added' }],

    attributes: {
        nonZeroBalance: {
            changelog: [{ version: '26.5.1', notes: 'added' }],
            description: 'Number of accounts with non-zero balance',
        },
    },
};
