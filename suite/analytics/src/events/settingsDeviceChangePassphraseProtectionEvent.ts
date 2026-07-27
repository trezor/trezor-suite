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
    descriptionTrigger:
        'User enables or disables passphrase protection in Settings > Device > Security > Passphrase',
    changelog: [{ version: '1.0.0', notes: 'added' }],

    attributes: {
        use_passphrase: {
            description: 'Whether passphrase protection is enabled (`true`) or disabled (`false`)',
            changelog: [{ version: '1.0.0', notes: 'added' }],
        },
    },
};
