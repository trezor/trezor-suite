import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    enabled: AttributeDef<boolean>;
    origin: AttributeDef<'bottomSheet' | 'settingsToggle'>;
};

// @ts-expect-error deprecated event name (see `EventName` in `suite-common/analytics/src/eventDefinition.ts`)
export const biometricsChangeEvent: EventDef<Attributes, EventType.BiometricsChange> = {
    name: EventType.BiometricsChange,
    descriptionTrigger: 'Changing biometrics on / off',
    changelog: [{ version: '23.11.1', notes: 'added' }],

    attributes: {
        enabled: {
            changelog: [{ version: '23.11.1', notes: 'added' }],
            description: 'Whether biometrics is enabled',
        },
        origin: {
            changelog: [{ version: '23.11.1', notes: 'added' }],
            description: 'Where the change was triggered',
        },
    },
};
