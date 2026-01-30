import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    isRedacted: AttributeDef<boolean>;
};

export const appLogExportedEvent: EventDef<Attributes, EventType.AppLogExported> = {
    name: EventType.AppLogExported,
    descriptionTrigger: 'App logs exported by user action.',
    changelog: [{ version: '26.2.0', notes: 'added' }],

    attributes: {
        isRedacted: {
            changelog: [{ version: '26.2.0', notes: 'added' }],
            description: 'Whether the sensitive data is hidden.',
        },
    },
};
