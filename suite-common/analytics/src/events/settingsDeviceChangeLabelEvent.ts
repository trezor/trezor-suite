import { EventType } from '../constants';
import type { EventDef } from '../eventDefinition';

type Attributes = Record<never, never>;

export const settingsDeviceChangeLabelEvent: EventDef<
    Attributes,
    EventType.SettingsDeviceChangeLabel
> = {
    name: EventType.SettingsDeviceChangeLabel,
    descriptionTrigger: 'Settings > Device > CUSTOMIZATION > Device name',
    changelog: [{ version: '1.0.0', notes: 'added' }],
    attributes: {},
};
