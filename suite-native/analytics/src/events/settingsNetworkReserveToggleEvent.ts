import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    enabled: AttributeDef<boolean>;
};

export const settingsNetworkReserveToggleEvent: EventDef<
    Attributes,
    EventType.SettingsNetworkReserveToggle
> = {
    name: EventType.SettingsNetworkReserveToggle,
    descriptionTrigger:
        'Triggered by network reserve switch in app settings under advanced section. When user changes behaviour of network reserve feature.',
    changelog: [{ version: '26.2.1', notes: 'Added' }],
    attributes: {
        enabled: {
            changelog: [{ version: '26.2.1', notes: 'Boolean values for new value: true / false' }],
        },
    },
};
