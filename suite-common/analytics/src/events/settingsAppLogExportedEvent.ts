import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    isRedacted: AttributeDef<boolean>;
};

export const settingsAppLogExportedEvent: EventDef<Attributes, EventType.SettingsAppLogExported> = {
    name: EventType.SettingsAppLogExported,
    descriptionTrigger: 'User exports application debug logs from the settings menu',
    changelog: [{ version: '26.2.1', notes: 'added' }],

    attributes: {
        isRedacted: {
            changelog: [{ version: '26.2.1', notes: 'added' }],
            description:
                'Whether sensitive data was redacted from the exported logs (`true`) or included (`false`)',
        },
    },
};
