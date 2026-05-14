import { EventType } from '../constants';
import type { EventDef } from '../eventDefinition';

type Attributes = Record<never, never>;

export const settingsDeviceWipeEvent: EventDef<Attributes, EventType.SettingsDeviceWipe> = {
    name: EventType.SettingsDeviceWipe,
    descriptionTrigger: 'Settings > Device > DANGER AREA > Wipe memory',
    changelog: [{ version: '1.19.0', notes: 'added' }],
    attributes: {},
};
