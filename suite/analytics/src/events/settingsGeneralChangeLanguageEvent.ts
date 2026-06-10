import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    previousLanguage: AttributeDef<string>;
    previousAutodetectLanguage: AttributeDef<boolean>;
    language: AttributeDef<string>;
    autodetectLanguage: AttributeDef<boolean>;
    platformLanguages: AttributeDef<string>;
};

export const settingsGeneralChangeLanguageEvent: EventDef<
    Attributes,
    EventType.SettingsGeneralChangeLanguage
> = {
    name: EventType.SettingsGeneralChangeLanguage,
    descriptionTrigger:
        'User changes the application language in Settings > Application > Localization > Language',
    changelog: [{ version: '1.0.0', notes: 'added' }],

    attributes: {
        language: {
            description:
                'The selected language code: Available Suite languages e.g. `en`, `cs`, `de`, etc.',
            changelog: [{ version: '1.0.0', notes: 'added' }],
        },
        previousLanguage: {
            description: 'The previously selected language code before this change',
            changelog: [{ version: '1.17.0', notes: 'added' }],
        },
        previousAutodetectLanguage: {
            description: 'Whether auto-detection was previously enabled before this change',
            changelog: [{ version: '1.17.0', notes: 'added' }],
        },
        autodetectLanguage: {
            description:
                'Whether auto-detection of system language is enabled (`true`) or manual language selection is used (`false`)',
            changelog: [{ version: '1.17.0', notes: 'added' }],
        },
        platformLanguages: {
            description: 'Platform languages separated by comma (the system language settings)',
            changelog: [{ version: '1.17.0', notes: 'added' }],
        },
    },
};
