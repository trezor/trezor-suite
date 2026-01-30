import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type ThemeValue = 'light' | 'dark' | 'debug';

type Attributes = {
    previousTheme: AttributeDef<ThemeValue>;
    previousAutodetectTheme: AttributeDef<boolean>;
    theme: AttributeDef<ThemeValue>;
    autodetectTheme: AttributeDef<boolean>;
    platformTheme: AttributeDef<ThemeValue>;
};

export const settingsGeneralChangeThemeEvent: EventDef<
    Attributes,
    EventType.SettingsGeneralChangeTheme
> = {
    name: EventType.SettingsGeneralChangeTheme,
    descriptionTrigger: 'Settings > Application > APPLICATION > Color scheme',
    changelog: [{ version: '1.17.0', notes: 'added' }],

    attributes: {
        theme: {
            changelog: [{ version: '1.17.0', notes: 'added' }],
            description: '"dark" or "light"',
        },
        platformTheme: {
            changelog: [{ version: '1.17.0', notes: 'added' }],
            description: '"dark" or "light"',
        },
        previousTheme: {
            changelog: [{ version: '1.17.0', notes: 'added' }],
            description: '"dark" or "light"',
        },
        autodetectTheme: {
            changelog: [{ version: '1.17.0', notes: 'added' }],
        },
        previousAutodetectTheme: {
            changelog: [{ version: '1.17.0', notes: 'added' }],
        },
    },
};
