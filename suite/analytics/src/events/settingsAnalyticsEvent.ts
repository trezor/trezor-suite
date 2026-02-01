import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    value: AttributeDef<boolean>;
};

export const settingsAnalyticsEvent: EventDef<Attributes, EventType.SettingsAnalytics> = {
    name: EventType.SettingsAnalytics,
    descriptionTrigger: 'User enables or disables analytics in Settings',
    changelog: [{ version: '1.0.0', notes: 'added' }],

    attributes: {
        value: {
            changelog: [{ version: '1.0.0', notes: 'added' }],
        },
    },
};
