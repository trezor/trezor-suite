import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    firmware?: AttributeDef<'install' | 'update' | 'skip' | 'up-to-date'>;
    seed?: AttributeDef<'create' | 'recovery' | 'recovery-in-progress'>;
    seedType?: AttributeDef<'shamir-single' | 'shamir-advanced' | '12-words' | '24-words'>;

    wasSelectTypeOpened?: AttributeDef<boolean>;
    recoveryType?: AttributeDef<'standard' | 'advanced'>;

    backup?: AttributeDef<'create' | 'skip'>;
    pin?: AttributeDef<'create' | 'skip'>;

    duration: AttributeDef<number>;
    device: AttributeDef<string>;
    unitPackaging: AttributeDef<number>;
};

export const deviceSetupCompletedEvent: EventDef<Attributes, EventType.DeviceSetupCompleted> = {
    name: EventType.DeviceSetupCompleted,
    descriptionTrigger: 'Fired when device is successfully setup using in-app onboarding',
    changelog: [
        { version: '1.16.0', notes: 'added' },
        { version: '24.6.2', notes: 'updated' },
    ],

    attributes: {
        firmware: {
            changelog: [{ version: '1.16.0', notes: 'added' }],
        },
        seed: {
            changelog: [{ version: '1.16.0', notes: 'added' }],
        },
        seedType: {
            changelog: [{ version: '1.16.0', notes: 'added' }],
        },
        wasSelectTypeOpened: {
            changelog: [{ version: '1.16.0', notes: 'added' }],
        },
        recoveryType: {
            changelog: [{ version: '1.16.0', notes: 'added' }],
        },
        backup: {
            changelog: [{ version: '1.16.0', notes: 'added' }],
        },
        pin: {
            changelog: [{ version: '1.16.0', notes: 'added' }],
        },
        duration: {
            changelog: [{ version: '1.16.0', notes: 'added' }],
        },
        device: {
            changelog: [{ version: '1.16.0', notes: 'added' }],
        },
        unitPackaging: {
            changelog: [{ version: '1.16.0', notes: 'added' }],
        },
    },
};
