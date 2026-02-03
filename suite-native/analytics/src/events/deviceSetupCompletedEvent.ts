import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { DeviceModelInternal } from '@trezor/device-utils';

import { EventType } from '../constants';

type Attributes = {
    osName?: AttributeDef<string>;
    deviceModel?: AttributeDef<DeviceModelInternal | null>;
    duration?: AttributeDef<number>;
    seed?: AttributeDef<'create' | 'recovery'>;
    firmware?: AttributeDef<'install' | 'update' | 'skip' | 'up-to-date'>;
    seedType?: AttributeDef<'shamir-single' | 'shamir-advanced' | '12-words' | '24-words'>;
    recoveryStepBack?: AttributeDef<boolean>;
    wasBackupSkipped?: AttributeDef<boolean>;
    wasPinSkipped?: AttributeDef<boolean>;
};

export const deviceSetupCompletedEvent: EventDef<Attributes, EventType.DeviceSetupCompleted> = {
    name: EventType.DeviceSetupCompleted,
    descriptionTrigger: 'User successfully finished device onboarding flow.',
    changelog: [{ version: '25.5.1', notes: 'added' }],
    attributes: {
        osName: { changelog: [{ version: '25.5.1', notes: 'added' }] },
        deviceModel: { changelog: [{ version: '25.5.1', notes: 'added' }] },
        duration: { changelog: [{ version: '25.5.1', notes: 'added' }] },
        seed: { changelog: [{ version: '25.5.1', notes: 'added' }] },
        firmware: { changelog: [{ version: '25.5.1', notes: 'added' }] },
        seedType: { changelog: [{ version: '25.5.1', notes: 'added' }] },
        recoveryStepBack: {
            changelog: [{ version: '25.6.1', notes: 'added' }],
        },
        wasBackupSkipped: {
            changelog: [{ version: '25.7.1', notes: 'added' }],
        },
        wasPinSkipped: {
            changelog: [{ version: '25.7.1', notes: 'added' }],
        },
    },
};
