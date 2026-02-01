import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    use_passphrase: AttributeDef<boolean>;
};

export const settingsDeviceChangePassphraseProtectionEvent: EventDef<
    Attributes,
    EventType.SettingsDeviceChangePassphraseProtection
> = {
    name: EventType.SettingsDeviceChangePassphraseProtection,
    descriptionTrigger: 'Settings > Device > SECURITY > Passphrase',
    changelog: [{ version: '1.0.0', notes: 'added' }],

    attributes: {
        use_passphrase: {
            changelog: [{ version: '1.0.0', notes: 'added' }],
        },
    },
};
