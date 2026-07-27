import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    option: AttributeDef<'notWorking' | 'close'>;
};

export const deviceConnectionHintModalEvent: EventDef<
    Attributes,
    EventType.DeviceConnectionHintModal
> = {
    name: EventType.DeviceConnectionHintModal,
    descriptionTrigger: 'User interacts with the device connection hint modal dialog',
    changelog: [{ version: '25.12.1', notes: 'added' }],

    attributes: {
        option: {
            description:
                'The user action taken in the modal: `notWorking` when clicking help link, `close` when dismissing the modal',
            changelog: [{ version: '25.12.1', notes: 'added' }],
        },
    },
};
