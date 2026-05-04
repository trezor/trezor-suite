import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<string>;
    symbol: AttributeDef<string>;
};

export const accountsActionsEvent: EventDef<Attributes, EventType.AccountsActions> = {
    name: EventType.AccountsActions,
    descriptionTrigger: 'User interacts with the Account navigation menu by clicking on an action button (e.g., rename, duplicate, remove)',
    changelog: [{ version: '23.12.0', notes: 'added' }],

    attributes: {
        action: {
            description: 'The type of action performed: "rename" to rename account, "duplicate" to duplicate account, "remove" to delete account, etc.',
            changelog: [{ version: '23.12.0', notes: 'added' }],
        },
        symbol: {
            description: 'The blockchain network or asset symbol for the account that the action was performed on',
            changelog: [{ version: '23.12.0', notes: 'added' }],
        },
    },
};
