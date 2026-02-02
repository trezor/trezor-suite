import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    analyticsPermission: AttributeDef<boolean>;
};

export const settingsDataPermissionEvent: EventDef<Attributes, EventType.SettingsDataPermission> = {
    name: EventType.SettingsDataPermission,
    descriptionTrigger: 'On Toggling data permissions settings.',
    changelog: [{ version: '23.4.1', notes: 'added' }],

    attributes: {
        analyticsPermission: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'Whether analytics permission is granted',
        },
    },
};
