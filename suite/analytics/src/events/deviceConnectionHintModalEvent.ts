import type { AttributeDef, EventDef } from '@suite-common/analytics-types';

import { EventType } from '../constants';

type Attributes = {
    option: AttributeDef<'notWorking' | 'close'>;
};

export const deviceConnectionHintModalEvent: EventDef<
    Attributes,
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
