import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    option: AttributeDef<'dashboard' | 'dropdown'>;
};

export const deviceConnectionConnectButtonEvent: EventDef<
    Attributes,
    EventType.DeviceConnectionConnectButton
> = {
    name: EventType.DeviceConnectionConnectButton,
    descriptionTrigger: '?',
    changelog: [{ version: '?', notes: 'added' }],

    attributes: {
        option: {
            changelog: [{ version: '?', notes: 'added' }],
        },
    },
};
