import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    value: AttributeDef<boolean>;
};

export const menuToggleDiscreetEvent: EventDef<Attributes, EventType.MenuToggleDiscreet> = {
    name: EventType.MenuToggleDiscreet,
    descriptionTrigger: 'Eye icon in top-right corner',
    changelog: [{ version: '1.0.0', notes: 'added' }],

    attributes: {
        value: {
            changelog: [{ version: '1.0.0', notes: 'added' }],
        },
    },
};
