import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    value: AttributeDef<boolean>;
    location: AttributeDef<string>;
    modal?: AttributeDef<string>;
};

export const settingsTorEvent: EventDef<Attributes, EventType.SettingsTor> = {
    name: EventType.SettingsTor,
    descriptionTrigger: 'Desktop: Settings > Application > TOR > Tor switch or during onboarding',
    changelog: [
        { version: '1.1.0', notes: 'added' },
        { version: '1.19.0', notes: 'Renamed from `menu/toggle-tor` to `settings/tor`' },
        { version: '25.4.0', notes: 'updated' },
    ],

    attributes: {
        value: {
            changelog: [{ version: '1.1.0', notes: 'added' }],
        },
        location: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
        },
        modal: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
        },
    },
};
