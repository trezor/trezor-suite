import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type FeeLevelLabel } from '@suite-common/wallet-types';

import { EventType } from '../constants';

type Attributes = {
    value: AttributeDef<FeeLevelLabel>;
};

export const sendFeeLevelChangedEvent: EventDef<Attributes, EventType.SendFeeLevelChanged> = {
    name: EventType.SendFeeLevelChanged,
    descriptionTrigger:
        'User selects or changes the network fee level in the send transaction form',
    changelog: [{ version: '24.10.1', notes: 'Added' }],
    attributes: {
        value: {
            changelog: [{ version: '24.10.1', notes: 'added' }],
            description: 'The selected fee level: `high`, `normal`, `economy`, `low`, or `custom`',
        },
    },
};
