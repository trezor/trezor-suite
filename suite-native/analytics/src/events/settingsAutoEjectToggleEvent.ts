import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    enabled: AttributeDef<boolean>;
};

export const settingsAutoEjectToggleEvent: EventDef<Attributes, EventType.SettingsAutoEjectToggle> =
    {
        name: EventType.SettingsAutoEjectToggle,
        descriptionTrigger:
            'Triggered by auto eject switch in app settings under eject wallets section. When user changes behaviour of auto eject feature.',
        changelog: [{ version: '25.8.1', notes: 'Added' }],
        attributes: {
            enabled: {
                changelog: [
                    { version: '25.8.1', notes: 'Boolean values for new value: true / false' },
                ],
            },
        },
    };
