import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    enabled: AttributeDef<boolean>;
    origin: AttributeDef<'bottomSheet' | 'settingsToggle'>;
};

export const biometricsChangeEvent: EventDef<Attributes, EventType.BiometricsChange> = {
    name: EventType.BiometricsChange,
    descriptionTrigger:
        'User enables or disables biometric authentication (fingerprint/face recognition)',
    changelog: [{ version: '23.11.1', notes: 'added' }],

    attributes: {
        enabled: {
            changelog: [{ version: '23.11.1', notes: 'added' }],
            description:
                'Whether biometric authentication is now enabled (`true`) or disabled (`false`)',
        },
        origin: {
            changelog: [{ version: '23.11.1', notes: 'added' }],
            description:
                'Where the biometric change was triggered: `bottomSheet` from a bottom sheet menu, `settingsToggle` from settings toggle',
        },
    },
};
