import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    option: AttributeDef<'notWorking' | 'close'>;
};

export const deviceConnectionHintModalEvent: EventDef<
    Attributes,
    // @ts-expect-error deprecated event name (see `EventName` in `suite-common/analytics/src/eventDefinition.ts`)
    EventType.DeviceConnectionHintModal
> = {
    name: EventType.DeviceConnectionHintModal,
    descriptionTrigger: '?',
    changelog: [{ version: '?', notes: 'added' }],

    attributes: {
        option: {
            changelog: [{ version: '?', notes: 'added' }],
        },
    },
};
