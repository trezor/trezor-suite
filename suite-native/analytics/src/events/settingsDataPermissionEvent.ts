import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    analyticsPermission: AttributeDef<boolean>;
};

export const settingsDataPermissionEvent: EventDef<Attributes, EventType.SettingsDataPermission> = {
    name: EventType.SettingsDataPermission,
    descriptionTrigger:
        'User enables or disables data collection and analytics permission in application settings',
    changelog: [{ version: '23.4.1', notes: 'added' }],

    attributes: {
        analyticsPermission: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description:
                '`true` if analytics data collection is permitted, `false` if analytics collection is disabled',
        },
    },
};
