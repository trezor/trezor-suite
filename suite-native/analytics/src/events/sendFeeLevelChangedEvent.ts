import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type FeeLevelLabel } from '@suite-common/wallet-types';

import { EventType } from '../constants';

type Attributes = {
    value: AttributeDef<FeeLevelLabel>;
};

export const sendFeeLevelChangedEvent: EventDef<Attributes, EventType.SendFeeLevelChanged> = {
    name: EventType.SendFeeLevelChanged,
    descriptionTrigger: 'Dispatched when user changes a fee level in send form.',
    changelog: [{ version: '24.10.1', notes: 'Added' }],
    attributes: {
        value: { changelog: [{ version: '24.10.1', notes: 'added' }] },
    },
};
