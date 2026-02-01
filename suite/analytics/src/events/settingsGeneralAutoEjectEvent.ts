import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    value: AttributeDef<boolean>;
};

export const settingsGeneralAutoEjectEvent: EventDef<
    Attributes,
    EventType.SettingsGeneralAutoEject
> = {
    name: EventType.SettingsGeneralAutoEject,
    descriptionTrigger: '?',
    changelog: [{ version: '?', notes: 'added' }],

    attributes: {
        value: {
            changelog: [{ version: '?', notes: 'added' }],
        },
    },
};
