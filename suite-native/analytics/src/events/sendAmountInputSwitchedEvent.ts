import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type ChangedTo = 'crypto' | 'fiat';

type Attributes = {
    changedTo: AttributeDef<ChangedTo>;
};

export const sendAmountInputSwitchedEvent: EventDef<Attributes, EventType.SendAmountInputSwitched> =
    {
        name: EventType.SendAmountInputSwitched,
        descriptionTrigger:
            'Dispatched when a user toggles between crypto and fiat amount inputs in the send form.',
        changelog: [{ version: '24.10.1', notes: 'Added' }],
        attributes: {
            changedTo: { changelog: [{ version: '24.10.1', notes: 'added' }] },
        },
    };
