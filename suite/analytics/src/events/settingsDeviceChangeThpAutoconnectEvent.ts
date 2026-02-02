import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export type SettingsDeviceChangeThpAutoConnectEventAction =
    | 'disable-autoconnect'
    | 'enable-autoconnect';

type Attributes = {
    action: AttributeDef<SettingsDeviceChangeThpAutoConnectEventAction>;
};

export const settingsDeviceChangeThpAutoconnectEvent: EventDef<
    Attributes,
    EventType.SettingsDeviceChangeThpAutoconnect
> = {
    name: EventType.SettingsDeviceChangeThpAutoconnect,
    descriptionTrigger: '?',
    changelog: [{ version: '?', notes: 'added' }],

    attributes: {
        action: {
            changelog: [{ version: '?', notes: 'added' }],
        },
    },
};
