import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    value: AttributeDef<boolean>;
};

export const menuToggleDiscreetEvent: EventDef<Attributes, EventType.MenuToggleDiscreet> = {
    name: EventType.MenuToggleDiscreet,
    descriptionTrigger: 'User clicks the Hide Balances button to toggle discreet mode on or off',
    changelog: [{ version: '1.0.0', notes: 'added' }],

    attributes: {
        value: {
            changelog: [{ version: '1.0.0', notes: 'added' }],
            description: '`true` if discreet mode is enabled, `false` if disabled',
        },
    },
};
