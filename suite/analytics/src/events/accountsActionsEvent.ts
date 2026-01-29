import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<string>;
    symbol: AttributeDef<string>;
};

export const accountsActionsEvent: EventDef<Attributes, EventType.AccountsActions> = {
    name: EventType.AccountsActions,
    descriptionTrigger: 'A user clicks on a button in Account nav',
    changelog: [{ version: '23.12.0', notes: 'added' }],

    attributes: {
        action: {
            changelog: [{ version: '23.12.0', notes: 'added' }],
        },
        symbol: {
            changelog: [{ version: '23.12.0', notes: 'added' }],
        },
    },
};
