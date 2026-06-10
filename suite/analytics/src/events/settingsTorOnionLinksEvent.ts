import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    value: AttributeDef<boolean>;
};

export const settingsTorOnionLinksEvent: EventDef<Attributes, EventType.SettingsTorOnionLinks> = {
    name: EventType.SettingsTorOnionLinks,
    descriptionTrigger:
        'User enables or disables opening trezor.io links as Tor .onion links in Settings > Application > TOR (requires Tor to be enabled)',
    changelog: [{ version: '1.1.0', notes: 'added' }],

    attributes: {
        value: {
            description:
                'Whether opening trezor.io links as .onion links is enabled (`true`) or disabled (`false`)',
            changelog: [{ version: '1.1.0', notes: 'added' }],
        },
    },
};
