import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    theme: AttributeDef<string>;
};

export const settingsChangeThemeEvent: EventDef<Attributes, EventType.SettingsChangeTheme> = {
    name: EventType.SettingsChangeTheme,
    descriptionTrigger: 'On theme change in settings',
    changelog: [{ version: '23.4.1', notes: 'added' }],

    attributes: {
        theme: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'The selected theme (`light`, `dark`, `system`)',
        },
    },
};
