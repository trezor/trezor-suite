import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    discreetMode: AttributeDef<boolean>;
};

export const settingsDiscreetToggleEvent: EventDef<Attributes, EventType.SettingsDiscreetToggle> = {
    name: EventType.SettingsDiscreetToggle,
    descriptionTrigger: 'On Toggling discreet mode settings.',
    changelog: [{ version: '23.4.1', notes: 'added' }],

    attributes: {
        discreetMode: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'Whether discreet mode is enabled',
        },
    },
};
