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
    descriptionTrigger:
        'User clicks the connect device button from the dashboard or a dropdown menu',
    changelog: [{ version: '25.12.1', notes: 'added' }],

    attributes: {
        option: {
            description:
                'The location from where the connect button was clicked: `dashboard` for main dashboard, `dropdown` for dropdown menu',
            changelog: [{ version: '25.12.1', notes: 'added' }],
        },
    },
};
