import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    value: AttributeDef<boolean>;
};

export const settingsGeneralNetworkReserveEvent: EventDef<
    Attributes,
    EventType.SettingsGeneralNetworkReserve
> = {
    name: EventType.SettingsGeneralNetworkReserve,
    descriptionTrigger: '?',
    changelog: [{ version: '1.0.0', notes: 'added' }],

    attributes: {
        value: {
            changelog: [{ version: '1.0.0', notes: 'added' }],
        },
    },
};
