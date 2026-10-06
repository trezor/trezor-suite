import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export type SettingsDeviceChangeThpAutoConnectEventAction =
    'disable-autoconnect' | 'enable-autoconnect';

type Attributes = {
    action: AttributeDef<SettingsDeviceChangeThpAutoConnectEventAction>;
};

export const settingsDeviceChangeThpAutoconnectEvent: EventDef<
    Attributes,
    EventType.SettingsDeviceChangeThpAutoconnect
> = {
    name: EventType.SettingsDeviceChangeThpAutoconnect,
    descriptionTrigger:
        'User changes the THP (Trezor Host Protocol) auto-connect setting on their device',
    changelog: [{ version: '25.7.1', notes: 'added' }],

    attributes: {
        action: {
            description:
                'The action taken: `enable-autoconnect` to enable automatic device connection via THP, `disable-autoconnect` to disable it',
            changelog: [{ version: '25.7.1', notes: 'added' }],
        },
    },
};
