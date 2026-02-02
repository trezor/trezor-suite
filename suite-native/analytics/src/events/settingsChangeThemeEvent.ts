import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    theme: AttributeDef<string>;
};

export const settingsChangeThemeEvent: EventDef<Attributes, EventType.SettingsChangeTheme> = {
    name: EventType.SettingsChangeTheme,
    descriptionTrigger: 'On changing color theme settings.',
    changelog: [{ version: '23.4.1', notes: 'added' }],

    attributes: {
        theme: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'The selected theme',
        },
    },
};
