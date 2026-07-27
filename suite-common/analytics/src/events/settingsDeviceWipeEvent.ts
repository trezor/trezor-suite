import { EventType } from '../constants';
import type { EventDef } from '../eventDefinition';

type Attributes = Record<never, never>;

export const settingsDeviceWipeEvent: EventDef<Attributes, EventType.SettingsDeviceWipe> = {
    name: EventType.SettingsDeviceWipe,
    descriptionTrigger:
        'User initiates device memory wipe operation from device settings (dangerous action)',
    changelog: [{ version: '1.19.0', notes: 'added' }],
    attributes: {},
};
