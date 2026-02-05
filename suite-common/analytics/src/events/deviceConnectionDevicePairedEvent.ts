import { EventType } from '../constants';
import type { EventDef } from '../eventDefinition';

type Attributes = {};

export const deviceConnectionDevicePairedEvent: EventDef<
    Attributes,
    // @ts-expect-error deprecated event name (see `EventName` in `suite-common/analytics/src/eventDefinition.ts`)
    EventType.DeviceConnectionDevicePaired
> = {
    name: EventType.DeviceConnectionDevicePaired,
    descriptionTrigger: ' User successfully finish bluetooth pairing',
    changelog: [{ version: '25.11.1', notes: 'added' }],
    attributes: {},
};
