import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    discreetMode: AttributeDef<boolean>;
};

export const settingsDiscreetToggleEvent: EventDef<Attributes, EventType.SettingsDiscreetToggle> = {
    name: EventType.SettingsDiscreetToggle,
    descriptionTrigger:
        'User enables or disables discreet mode in application settings to hide balance amounts and sensitive information',
    changelog: [{ version: '23.4.1', notes: 'added' }],

    attributes: {
        discreetMode: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description:
                '`true` if discreet mode is enabled (hiding sensitive data), `false` if disabled (showing data normally)',
        },
    },
};
