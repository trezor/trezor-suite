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
    descriptionTrigger: 'Settings > Application > LOCALIZATION > Language',
    changelog: [{ version: '1.0.0', notes: 'added' }],

    attributes: {
        language: {
            changelog: [{ version: '1.0.0', notes: 'added' }],
            description: 'Available Suite languages e.g. "en"',
        },
        previousLanguage: {
            changelog: [{ version: '1.17.0', notes: 'added' }],
            description: 'Available Suite languages e.g. "en"',
        },
        previousAutodetectLanguage: {
            changelog: [{ version: '1.17.0', notes: 'added' }],
        },
        autodetectLanguage: {
            changelog: [{ version: '1.17.0', notes: 'added' }],
        },
        platformLanguages: {
            changelog: [{ version: '1.17.0', notes: 'added' }],
            description: 'platform languages separated by comma',
        },
    },
};
