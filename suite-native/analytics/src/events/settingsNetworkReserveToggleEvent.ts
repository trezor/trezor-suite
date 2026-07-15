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
        'User toggles the network reserve protection feature on or off in app settings under the advanced section',
    changelog: [{ version: '26.2.1', notes: 'Added' }],
    attributes: {
        enabled: {
            changelog: [
                { version: '26.2.1', notes: 'Boolean values for new value: `true` / `false`' },
            ],
            description: '`true` if network reserve protection is enabled, `false` if disabled',
        },
    },
};
