import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    isRedacted: AttributeDef<boolean>;
};

export const settingsAppLogExportedEvent: EventDef<Attributes, EventType.SettingsAppLogExported> = {
    name: EventType.SettingsAppLogExported,
    descriptionTrigger: 'App logs exported by user action.',
    changelog: [{ version: '26.2.1', notes: 'added' }],

    attributes: {
        isRedacted: {
            changelog: [{ version: '26.2.1', notes: 'added' }],
            description: 'Whether the sensitive data is excluded.',
        },
    },
};
