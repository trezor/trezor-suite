import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    value: AttributeDef<boolean>;
};

export const settingsTorOnionLinksEvent: EventDef<Attributes, EventType.SettingsTorOnionLinks> = {
    name: EventType.SettingsTorOnionLinks,
    descriptionTrigger:
        'Desktop: Settings > Application > TOR > Open [trezor.io](http://trezor.io/) links as .onion links (Tor has to be enabled)',
    changelog: [{ version: '1.1.0', notes: 'added' }],

    attributes: {
        value: {
            changelog: [{ version: '1.1.0', notes: 'added' }],
        },
    },
};
