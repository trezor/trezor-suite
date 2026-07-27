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
    descriptionTrigger: 'User toggles network reserve fee setting in general preferences',
    changelog: [{ version: '1.0.0', notes: 'added' }],

    attributes: {
        value: {
            description: 'Whether network reserve is enabled (`true`) or disabled (`false`)',
            changelog: [{ version: '1.0.0', notes: 'added' }],
        },
    },
};
