import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    enabled: AttributeDef<boolean>;
};

export const settingsAutoEjectToggleEvent: EventDef<Attributes, EventType.SettingsAutoEjectToggle> =
    {
        name: EventType.SettingsAutoEjectToggle,
        descriptionTrigger:
            'User toggles the auto-eject feature on/off in the app settings under the wallets section',
        changelog: [{ version: '25.8.1', notes: 'Added' }],
        attributes: {
            enabled: {
                changelog: [
                    { version: '25.8.1', notes: 'Boolean values for new value: `true` / `false`' },
                ],
                description: '`true` if auto-eject is enabled, `false` if disabled',
            },
        },
    };
