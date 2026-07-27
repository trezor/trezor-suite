import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type ThemeValue = 'light' | 'dark' | 'debug';

type Attributes = {
    previousTheme: AttributeDef<ThemeValue>;
    previousAutodetectTheme: AttributeDef<boolean>;
    theme: AttributeDef<ThemeValue>;
    autodetectTheme: AttributeDef<boolean>;
    platformTheme: AttributeDef<'light' | 'dark'>;
};

export const settingsGeneralChangeThemeEvent: EventDef<
    Attributes,
    EventType.SettingsGeneralChangeTheme
> = {
    name: EventType.SettingsGeneralChangeTheme,
    descriptionTrigger:
        'User changes the application color scheme theme in Settings > Application > Color scheme',
    changelog: [{ version: '1.17.0', notes: 'added' }],

    attributes: {
        theme: {
            description:
                'The selected theme: `light` for light mode, `dark` for dark mode, `debug` for debug theme',
            changelog: [{ version: '1.17.0', notes: 'added' }],
        },
        platformTheme: {
            description:
                'The operating system theme: `light` for light mode or `dark` for dark mode',
            changelog: [{ version: '1.17.0', notes: 'added' }],
        },
        previousTheme: {
            description: 'The previously selected theme before this change',
            changelog: [{ version: '1.17.0', notes: 'added' }],
        },
        autodetectTheme: {
            description:
                'Whether auto-detection of system theme is enabled (`true`) or manual theme selection is used (`false`)',
            changelog: [{ version: '1.17.0', notes: 'added' }],
        },
        previousAutodetectTheme: {
            description: 'Whether auto-detection was previously enabled before this change',
            changelog: [{ version: '1.17.0', notes: 'added' }],
        },
    },
};
