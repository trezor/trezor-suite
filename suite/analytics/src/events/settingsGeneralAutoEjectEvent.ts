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
    descriptionTrigger: 'User toggles automatic device ejection setting in general preferences',
    changelog: [{ version: '25.7.1', notes: 'added' }],

    attributes: {
        value: {
            description: 'Whether auto-eject is enabled (`true`) or disabled (`false`)',
            changelog: [{ version: '25.7.1', notes: 'added' }],
        },
    },
};
