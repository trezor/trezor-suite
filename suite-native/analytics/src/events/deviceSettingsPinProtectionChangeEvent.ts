import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type PinProtectionAction = 'enable' | 'change' | 'disable';

type Attributes = {
    action: AttributeDef<PinProtectionAction>;
};

export const deviceSettingsPinProtectionChangeEvent: EventDef<
    Attributes,
    EventType.DeviceSettingsPinProtectionChange
> = {
    name: EventType.DeviceSettingsPinProtectionChange,
    descriptionTrigger: 'When any PIN protection action button is clicked.',
    changelog: [{ version: '24.11.1', notes: 'Added' }],
    attributes: {
        action: { changelog: [{ version: '24.11.1', notes: 'added' }] },
    },
};
